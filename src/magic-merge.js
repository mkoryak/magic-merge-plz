import GitHubApi from 'github';
import EventEmitter from 'events';

export default class MagicMerge extends EventEmitter {

    // settings.org         string, org name - catalant
    // settings.interval    number, interval in ms how often to re-check for prs
    // settings.repos       array, array of repo names in org to check
    // settings.label       string, magic label name, defaults to 'a magic merge plz'
    // settings.auth        object, auth object with {username, password} or {token}
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
                username: settings.auth.username,
                password: settings.auth.password
            };
        }
        this.github = new GitHubApi({
            debug: false,
            protocol: 'https',
            host: 'api.github.com',
            headers: {
                'Accept': 'application/vnd.github.black-cat-preview+json',
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
            const opts = (obj={}) => {
               return Object.assign({}, {
                   owner: this.settings.org,
                   repo,
                   name: this.label
               }, obj);
            };
            try {
                await this.github.issues.getLabel(opts());
            } catch (nope) {
                // const l = await this.github.issues.createLabel(opts({
                //     color: '00ff00'
                // }));
                // TODO: the above does not work for some reason. investigate!
                this.emit('warning', `repo ${repo} does not have a label named [${this.label}]`);
            }
        });
    }

    async loop() {
        this.github.authenticate(this.auth);
        this.settings.repos.forEach(async repo => {

            const opts = (obj={}) => {
               return Object.assign({}, {owner: this.settings.org, repo}, obj);
            };

            const prs = await this.github.pullRequests.getAll(opts());

            this.emit('debug', `[${repo}] has ${prs.length} open PRs`);

            prs.forEach(async pr => {
                const hasMagicLabel = (await this.github.issues.getIssueLabels(opts({
                    name: this.label,
                    number: pr.number
                }))).length > 0;

                if (this.settings.ancientPrDays) {
                    const now = Date.now();
                    const createdAt = new Date(pr.created_at).getTime();
                    const endTime = createdAt + (3600000 * 24 * this.settings.stalePrDays);
                    if (now > endTime) {
                        // this PR has been open for longer than `ancientPrDays`
                        this.emit('stale', pr, repo);
                    }
                }

                if (hasMagicLabel) {
                    const reviews = await this.github.pullRequests.getReviews(opts({number: pr.number}));

                    const approved = reviews.find(t => t.state === 'APPROVED');

                    if (approved) {
                        const mergeStatus = await this.github.pullRequests.merge(opts({
                            number: pr.number,
                            sha: pr.head.sha,
                            commit_title: "magic merge!"
                        }));

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
                        } else {
                            this.emit('debug', `pr #${pr.number} in [${repo}] could not be merged: ${JSON.stringify(mergeStatus)}`);
                        }
                    } else {
                        this.emit('debug', `pr #${pr.number} in [${repo}] has not been approved yet, skipping`);
                    }
                } else {
                    this.emit('debug', `pr #${pr.number} in [${repo}] does not have a magic label, skipping`);
                }
            });
        });
    }

    async start() {
        await this.ensureMagicLabels();
        return setInterval(() => this.loop(), this.settings.interval);
    }

};
