import GitHubApi from 'github';
import EventEmitter from 'events';


const STALE_PR_LABEL = 'Stale PR';

export default class extends EventEmitter {

    // settings.org         string, org name - catalant
    // settings.interval    number, interval in ms how often to re-check for prs
    // settings.repos       array, array of repo names in org to check
    // settings.label       string, magic label name, defaults to 'a magic merge plz'
    // settings.user        string, username of user who will be acting on behalf of magic-merge
    // settings.auth        object, auth object with {password} or {token}
    // settings.stalePrDays number, number of days a pr should stay open to get an emitted event about it

    constructor(settings) {
        super();

        this.settings = settings;
        this.label = settings.label || 'a magic merge plz';

        if (settings.auth.token) {
            this.auth = {
                type: 'oauth',
                token: settings.auth.token
            };
        } else {
            this.auth = {
                type: 'basic',
                username: settings.username,
                password: settings.auth.password
            };
        }
        this.github = new GitHubApi({
            debug: false,
            protocol: 'https',
            host: 'api.github.com',
            headers: {
                'user-agent': 'magic-merge-plz' // GitHub is happy with a unique user agent
            },
            Promise: Promise,
            followRedirects: false, // default: true; there's currently an issue with non-get
                                    // redirects, so allow ability to disable follow-redirects
            timeout: 5000
        });
    };

    async ensureMagicLabels() {
        this.settings.repos.forEach(async repo => {
            const opts = this.optsHelper(repo);
            try {
                await this.github.issues.createLabel(opts({
                    color: '00ff00',
                    name: this.label
                }));
            } catch(foo) {}

            try {
                await this.github.issues.createLabel(opts({
                    color: 'ff0000',
                    name: STALE_PR_LABEL
                }));
            } catch(foo) {}
        });
    }

    optsHelper(repo) {
        return (obj={}) => {
           return Object.assign({}, {owner: this.settings.org, repo}, obj);
        };
    }

    async getReaction(pr, repo, reaction) {
        const opts = this.optsHelper(repo);

        const status = (await this.github.reactions.getForIssue(opts({number: pr.number, content: reaction})))
            .filter(r => r.user.login === this.settings.username);

        if (status.length == 1 && status[0].id) {
            return status[0];
        }
    }
    async setReaction(pr, repo, reaction, value) {
        const opts = this.optsHelper(repo);

        if (value) {
            return this.github.reactions.createForIssue(opts({number: pr.number, content: reaction}));
        } else {
            const status = await this.getReaction(pr, repo, reaction);
            if (status) {
                return this.github.reactions.delete(opts({id: status.id}));
            }
        }
    }

    async loop() {
        this.github.authenticate(this.auth);
        this.settings.repos.forEach(async repo => {

            const opts = this.optsHelper(repo);

            const prs = await this.github.pullRequests.getAll(opts());

            this.emit('debug', `[${repo}] has ${prs.length} open PRs`);

            prs.forEach(async pr => {
                const hasMagicLabel = (await this.github.issues.getIssueLabels(opts({
                    name: this.label,
                    number: pr.number
                }))).filter(l => l.name === this.label).length === 1;

                if (this.settings.stalePrDays) {
                    const now = Date.now();
                    const createdAt = new Date(pr.created_at).getTime();
                    const endTime = createdAt + (3600000 * 24 * this.settings.stalePrDays);

                    if (now > endTime) {
                        // this PR has been open for longer than `ancientPrDays`
                        this.emit('stale', pr, repo);
                        try {
                           this.github.issues.addLabels(opts({number: pr.number, body: [STALE_PR_LABEL]}));
                        } catch(dontCare) {}
                    }
                }

                if (hasMagicLabel) {
                    let reviews = await this.github.pullRequests.getReviews(opts({number: pr.number}));

                    const lastReviews = {};

                    reviews.forEach(r => {
                        let last = lastReviews[r.user.login];
                        const date = new Date(r.submitted_at).getTime();
                        if (last) {
                            if (last.date < date) {
                                lastReviews[r.user.login] = {
                                    date,
                                    state: r.state
                                }
                            }
                        } else {
                            lastReviews[r.user.login] = {
                                date,
                                state: r.state
                            }
                        }
                    });
                    // reviews returns entire history, so we only care about the last review of a given user
                    reviews = Object.values(lastReviews);

                    const approved = reviews.find(t => t.state === 'APPROVED');
                    const notApproved = reviews.find(t => t.state === 'CHANGES_REQUESTED');

                    this.github.issues.addAssigneesToIssue(opts({
                        number: pr.number,
                        assignees: [this.settings.username]
                    }));


                    if (notApproved) {
                        this.emit('debug', `pr #${pr.number} in [${repo}] has changes requested`);
                        this.setReaction(pr, repo, '-1', true);
                        this.setReaction(pr, repo, '+1', false);
                    } else if (approved) {
                        try {
                            const mergeStatus = await this.github.pullRequests.merge(opts({
                                number: pr.number,
                                sha: pr.head.sha,
                                commit_title: "magic merge!"
                            }));

                            this.setReaction(pr, repo, '-1', false);
                            this.setReaction(pr, repo, '+1', true);

                            if (mergeStatus.merged) {
                                // cool, create our comment and delete branch

                                this.github.issues.createComment(opts({
                                    number: pr.number,
                                    body: '☃  magicmerge by dogalant  ☃'
                                }));

                                this.github.gitdata.deleteReference(opts({
                                    ref: `heads/${pr.head.ref}`
                                }));

                                this.emit('debug', `pr #${pr.number} in [${repo}] was merged`);
                                this.emit('merged', pr, repo);
                            }  else {
                                this.emit('debug', `pr #${pr.number} in [${repo}] could not be merged: ${JSON.stringify(mergeStatus)}`);
                            }

                        } catch(notMergable) {
                            this.emit('warning', `pr #${pr.number} in [${repo}] could not be merged: ${JSON.stringify(notMergable)}`);
                        }
                    } else {
                        this.emit('debug', `pr #${pr.number} in [${repo}] has not been approved yet, skipping`);
                    }
                } else {
                    this.github.issues.removeAssigneesFromIssue(opts({
                        number: pr.number,
                        body: { "assignees": [this.settings.username] }
                    }));
                    this.emit('debug', `pr #${pr.number} in [${repo}] does not have a magic label, skipping`);
                }
            });
        });
    }

    async start() {
        await this.ensureMagicLabels();
        this.loop();
        return setInterval(() => this.loop(), this.settings.interval);
    }

};
