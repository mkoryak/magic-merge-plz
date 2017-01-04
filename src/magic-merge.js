import GitHubApi from 'github';
import EventEmitter from 'events';
import catmaker from './cats';
import poopmaker from './pooping';

const STALE_PR_LABEL = 'Stale PR';
const EXCLUDED_BRANCHES = new Set(['develop', 'master', 'release-candidate']);

export default class extends EventEmitter {

    // settings.org         string, org name - catalant
    // settings.repos       array, array of repo names in org to check
    // settings.label       string, magic label name, defaults to 'a magic merge plz'
    // settings.user        string, username of user who will be acting on behalf of magic-merge
    // settings.auth        object, auth object with {password} or {token}
    // settings.stalePrDays number, number of days a pr should stay open to get an emitted event
    // about it

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

        this.nextRequestTimeoutSeconds = 1; //this number will change based on rate limit calculations
    };

    /**
     * factory function that takes the 2 most common args in each api request, returns:
     * function(fn, args)
     *
     * the returned function knows about github request rate limits and will throttle calls to
     * fn to ensure that we never run out of requests
     * @param repo
     * @param pr
     * @returns {function()}
     */
    makeQueue(repo, pr) {
        const nipples = {
            owner: this.settings.org
        };
        repo && (nipples.repo = repo);
        pr && (nipples.number = pr.number);

        return (op, params={}) => {
            return new Promise((resolve, reject) => {
                setTimeout(async () => {
                    try {
                        const result = await op(Object.assign(
                            {},
                            nipples,
                            params
                        ));

                        if (result && result.meta) {
                            const meta = result.meta;
                            if (result.meta['x-ratelimit-remaining'] > 0) {
                                const unixNow = ~~(Date.now() / 1000);
                                this.nextRequestTimeoutSeconds = Math.max(
                                    ~~((meta['x-ratelimit-reset'] - unixNow) / meta['x-ratelimit-remaining']),
                                    1.5
                                );
                                // console.log('magic-merge.js - queue() timeout seconds:', this.nextRequestTimeoutSeconds, 'remaining: ', meta['x-ratelimit-remaining'], 'minutes left:', ((meta['x-ratelimit-reset'] - unixNow) / 60));
                            } else {
                                // not much i can do, next request will probably fail
                            }
                        }
                        resolve(result);
                    } catch(e) {
                        reject(e);
                    }
                }, this.nextRequestTimeoutSeconds * 1000);
            });
        };
    }

    /**
     * make sure that each repo we monitor has the labels we plan to use
     */
    async ensureMagicLabels() {

        await Promise.all(this.settings.repos.map(async repo => {
            const queue = this.makeQueue(repo);
            try {
                await queue(this.github.issues.createLabel, {
                    color: '00ff00',
                    name: this.label
                });
            } catch(foo) {}

            try {
                await queue(this.github.issues.createLabel, {
                    color: 'ff0000',
                    name: STALE_PR_LABEL
                });
            } catch(foo) {}
        }));
    }



    // thumbs up etc..
    async getReaction(pr, repo, reaction) {
        const queue = this.makeQueue(repo, pr);
        const status = (await queue(this.github.reactions.getForIssue, {content: reaction}))
            .find(r => r.user.login === this.settings.username);

        if (status && status.id) {
            return status;
        }
    }

    // thumbs up etc..
    async setReaction(pr, repo, reaction, value) {
        const queue = this.makeQueue(repo, pr);

        if (value) {
            return queue(this.github.reactions.createForIssue, {number: pr.number, content: reaction});
        } else {
            const status = await this.getReaction(pr, repo, reaction);
            if (status) {
                return queue(this.github.reactions.delete, {id: status.id});
            }
        }
    }

    async makeMergeComment(args) {
        try {
            const [ cat, poop ] = await Promise.all([ catmaker(), poopmaker() ]);

            args.body = [
                `☃  magicmerge by dogalant  ☃`,
                poop,
                `![poop](${cat})`
            ].join('\n\n');

        } catch (poo) {
            args.body = `☃  magicmerge by dogalant  ☃`;
        }
        const queue = this.makeQueue();
        return queue(this.github.issues.createComment, args);
    }

    // do work
    async loop() {
        this.github.authenticate(this.auth);
        await Promise.all(this.settings.repos.map(async repo => {

            const prs = await this.makeQueue(repo)(this.github.pullRequests.getAll);

            this.emit('debug', `[${repo}] has ${prs.length} open PRs`);


            prs.forEach(async pr => {
                const queue = this.makeQueue(repo, pr);
                const hasMagicLabel = (await queue(this.github.issues.getIssueLabels, {
                    name: this.label
                })).filter(l => l.name === this.label).length === 1;

                if (EXCLUDED_BRANCHES.has(pr.head.ref)) {
                    // lets be sure we never do anything really stupid with these
                    return;
                }

                if (this.settings.stalePrDays) {
                    const now = Date.now();
                    const createdAt = new Date(pr.created_at).getTime();
                    const endTime = createdAt + (3600000 * 24 * this.settings.stalePrDays);

                    if (now > endTime) {
                        // this PR has been open for longer than `ancientPrDays`
                        this.emit('stale', pr, repo);
                        try {
                           await queue(this.github.issues.addLabels, {body: [STALE_PR_LABEL]});
                        } catch(dontCare) {}
                    }
                }

                if (hasMagicLabel) {
                    const status = await queue(this.github.repos.getCombinedStatus, {ref: pr.head.sha});
                    if (status.state !== 'success' && status.statuses.length) {
                        // jenkins is building
                        this.emit('debug', `pr #${pr.number} in [${repo}] is still building`);
                        return;
                    }

                    let reviews = await queue(this.github.pullRequests.getReviews);

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
                    // reviews returns entire history, so we only care about the last review of a
                    // given user
                    reviews = Object.values(lastReviews);

                    const approved = reviews.find(t => t.state === 'APPROVED');
                    const notApproved = reviews.find(t => t.state === 'CHANGES_REQUESTED');

                    await queue(this.github.issues.addAssigneesToIssue, {
                        assignees: [this.settings.username]
                    });

                    if (notApproved) {
                        this.emit('debug', `pr #${pr.number} in [${repo}] has changes requested`);

                        await Promise.all([
                            this.setReaction(pr, repo, '-1', true),
                            this.setReaction(pr, repo, '+1', false)
                        ]);
                    } else if (approved) {
                        try {
                            const mergeStatus = await queue(this.github.pullRequests.merge, {
                                commit_title: "magic merge!"
                            });

                            await Promise.all([
                                this.setReaction(pr, repo, '-1', false),
                                this.setReaction(pr, repo, '+1', true)
                            ]);

                            if (mergeStatus.merged) {
                                // cool, create our comment and delete branch

                                await this.makeMergeComment({
                                    number: pr.number
                                });

                                await queue(this.github.gitdata.deleteReference, {
                                    ref: `heads/${pr.head.ref}`
                                });

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
                    queue(this.github.issues.removeAssigneesFromIssue, {
                        body: { "assignees": [this.settings.username] }
                    });
                    this.emit('debug', `pr #${pr.number} in [${repo}] does not have a magic label, skipping`);
                }
            });
        }));

        setTimeout(() => {
            this.loop();
        }, this.nextRequestTimeoutSeconds * 1000);
    }

    start() {
        this.ensureMagicLabels().then(() => {
            this.loop();
        });
        return this;
    }

};
