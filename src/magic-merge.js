import GitHubApi from 'github';
import EventEmitter from 'events';
import catmaker from './cats';
import poopmaker from './pooping';
import Bottleneck from 'bottleneck';
import markovChain from 'markov';
import markovSeed from './markov-seed';
import Jira from './jira';


const markov = markovChain(3);

markov.seed(markovSeed);

const STALE_PR_LABEL = 'Stale PR';
const EXCLUDED_BRANCHES = new Set(['develop', 'master', 'release-candidate']);

const limiter = new Bottleneck(3, 1000);

const PRIORITY = {
    INSANE: -1, //actually skip the queue, just do it and hope we dont run out of requests
    HIGHEST: 0,
    HIGH: 3,
    NORMAL: 5,
    WHATEVS: 10
};

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
        this.mergeOnlyLabel = 'a magic merge plz';
        this.everythingLabel = 'a magic everything plz';

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


        this.jira = new Jira(this.settings.jira.host, this.settings.jira.auth, this);

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

        this.selfAssinged = {};
        this.conditionalComments = {};
        this.readCommentsFromPR = {};
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

        const fn = async (op, params={}, priority=PRIORITY.NORMAL) => {
            if (params instanceof Number) {
                priority = params;
                params = {};
            }

            try {
                let result;
                const arg = Object.assign(
                    {},
                    nipples,
                    params
                );

                if (priority == PRIORITY.INSANE) {
                    this.emit('debug', 'insane priority request happened, it should not happen often');
                    result = await op(arg);
                } else {
                    result = await limiter.schedulePriority(priority, op, arg);
                }

                if (result && result.meta) {
                    const meta = result.meta;
                    if (result.meta['x-ratelimit-remaining'] > 0) {
                        const unixNow = ~~(Date.now() / 1000);
                        this.emit('rate-limit', meta['x-ratelimit-remaining'], (meta['x-ratelimit-reset'] - unixNow) / 60, limiter.nbQueued());
                    }
                }
                return result;
            } catch(e) {
                this.emit('error', e);
            }
        };
        fn.$key = pr ? pr.head.ref : 'poop';
        return fn;
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
                    name: this.mergeOnlyLabel
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
    async getReaction(queue, reaction, priority=PRIORITY.NORMAL, username) {
        username = username || this.settings.username;
        const list = await queue(this.github.reactions.getForIssue, {content: reaction}, priority);
        const status = list.find(r => r.user.login === username);
        if (status && status.id) {
            return status;
        }
    }

    // thumbs up etc..
    async setReaction(queue, reaction, value, priority=PRIORITY.NORMAL) {
        if (value) {
            return queue(this.github.reactions.createForIssue, {content: reaction}, priority);
        } else {
            const status = await this.getReaction(pr, repo, reaction, priority);
            if (status) {
                return queue(this.github.reactions.delete, {id: status.id}, priority);
            }
        }
    }

    async makeMergeComment(args) {
        const {pr} = args;

        const importantArgument = markov.respond(pr.body, 20).join(' ');
        try {
            const [ cat, poop ] = await Promise.all([ catmaker(), poopmaker() ]);
            const dogs = ['doge', 'dog', 'doggo', 'doggorino', 'longo doggo', 'doggest',
                'doggor', 'shiber', 'corgo', 'puggo', 'shibe', 'shoob', 'shoober', 'shooberino',
                'puggerino', 'pupper', 'pupperino', cat.name, 'puggorino'
            ];
            const doge = dogs[~~(dogs.length * Math.random())];

            args.body = [
                `☃  magicmerge by dogalant  ☃`,
                `Dear *${doge}*:\n ${importantArgument}`,
                poop,
                `![${cat.name}](${cat.url})` //no idea yet where is a good place for cat's person
            ].join('\n\n');

        } catch (poo) {
            args.body = `☃  magicmerge by dogalant  ☃`;
        }
        const queue = this.makeQueue();
        return queue(this.github.issues.createComment, args, PRIORITY.INSANE);
    }

    async updateJiraTicketProgress(queue, pr, status) {
        const ticket = this.jira.getTicketName(pr);

        if (ticket) {
            this.jira.transitionTo(ticket, status);
            const reaction = {'Code Complete': 'laugh', 'Reviewed': 'heart'}[status];
            this.addConditionalComment(queue, reaction, `Ticket status updated to ${status}: [${ticket}](https://${this.settings.jira.host}/browse/${ticket})`);
        }
    }

    /**
     * add a `comment` ONLY if `reactionName` has not been added to the PR (by settings.username)
     */
    async addConditionalComment(queue, reactionName, comment, chance=1) {
        const key = queue.$key+reactionName;
        if (!this.conditionalComments[key]) {
            this.conditionalComments[key] = true;
            // dont let them make the original request insanely, as it might happen more than ONCE
            const notified = await this.getReaction(queue, reactionName);
            if (!notified) {
                const priority = PRIORITY.INSANE;
                if (Math.random() <= chance) {
                    queue(this.github.issues.createComment, {body: comment}, priority);
                }
                await this.setReaction(queue, reactionName, true, priority);
            }
        }
    }

    // do work
    async loop() {
        this.github.authenticate(this.auth);
        this.settings.repos.map(async repo => {

            const prs = (await this.makeQueue(repo)(this.github.pullRequests.getAll, PRIORITY.HIGHEST) || []);

            this.emit('debug', `[${repo}] has ${prs.length} open PRs`);

            prs.forEach(async pr => {

                const ticket = this.jira.getTicketName(pr);

                const queue = this.makeQueue(repo, pr);
                const allLabels = await queue(this.github.issues.getIssueLabels, PRIORITY.HIGH);

                const hasMagicLabel = allLabels.find(l => l.name === this.mergeOnlyLabel);
                const hasEverythingLabel = allLabels.find(l => l.name === this.everythingLabel);

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
                           await queue(this.github.issues.addLabels, {body: [STALE_PR_LABEL]}, PRIORITY.WHATEVS);
                        } catch(dontCare) {}
                    }
                }


                if (!this.readCommentsFromPR[queue.$key]) {
                    const seed = (text) => {
                        text = text.replace(/\]\([^)]+\)|!\[|\[|\]/g, '');
                        text = text.replace(/(<img [^>]+>)/g, '');
                        text = text.replace(/\s+/g, ' ');
                        const idx = text.indexOf('<notifications@github.com> wrote:');
                        if (idx >= 0) {
                            text = text.substring(0, idx - 40);
                        }
                        if (text.replace(/\s+/g, '').length) {
                            markov.seed(text);
                        }
                    };

                    this.readCommentsFromPR[queue.$key] = true;

                    seed(pr.body);

                    const comments = await queue(this.github.issues.getComments, {per_page: 100});
                    comments.forEach(c => {
                        // parsing images out of text is a pain, so lets just ignore those things
                        // having them
                        if (c.user.login !== this.settings.username) {
                            seed(c.body);
                        }
                    });
                }


                if (ticket) {
                    const msg = await this.jira.getTicketSummary(ticket);
                    this.addConditionalComment(queue, 'hooray', msg);
                }

                if (hasMagicLabel || hasEverythingLabel) {
                    
                    let reviews = await queue(this.github.pullRequests.getReviews, PRIORITY.HIGH);

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


                    if (!this.selfAssinged[queue.$key]) {
                        queue(this.github.issues.addAssigneesToIssue, {
                            assignees: [this.settings.username]
                        });
                        this.selfAssinged[queue.$key] = true;
                    }

                    if (notApproved) {
                        this.emit('debug', `pr #${pr.number} in [${repo}] has changes requested`);
                    } else if (approved) {
                        try {
                            const mergeStatus = await queue(this.github.pullRequests.merge, {
                                commit_title: "magic merge!"
                            }, PRIORITY.INSANE);

                            if (mergeStatus.merged) {
                                // cool, create our comment and delete branch

                                await this.makeMergeComment({
                                    pr: pr,
                                    repo: repo
                                });

                                await queue(this.github.gitdata.deleteReference, {
                                    ref: `heads/${pr.head.ref}`
                                }, PRIORITY.INSANE);


                                if (hasEverythingLabel) {
                                    setTimeout(async () => {
                                        this.updateJiraTicketProgress(queue, pr, 'Reviewed');
                                    }, 1000 * 60 * 10);
                                }

                                this.emit('debug', `pr #${pr.number} in [${repo}] was merged`);
                                this.emit('merged', pr, repo);
                            }  else {
                                this.emit('debug', `pr #${pr.number} in [${repo}] could not be merged: ${JSON.stringify(mergeStatus)}`);
                            }

                        } catch(notMergable) {
                            this.emit('warning', `pr #${pr.number} in [${repo}] could not be merged: ${JSON.stringify(notMergable)}`);
                        }
                    } else {
                        if (hasEverythingLabel) {
                            this.updateJiraTicketProgress(queue, pr, 'Code Complete');
                        }

                        this.emit('debug', `pr #${pr.number} in [${repo}] has not been approved yet, skipping`);
                    }
                } else {
                    if (this.selfAssinged[queue.$key]) {
                        queue(this.github.issues.removeAssigneesFromIssue, {
                            body: { "assignees": [this.settings.username] }
                        }, PRIORITY.WHATEVS);
                        this.selfAssinged[queue.$key] = false;
                    }
                    this.emit('debug', `pr #${pr.number} in [${repo}] does not have a magic label, skipping`);
                }
            });
        });
    }

    start() {
        // this.ensureMagicLabels().then(() => {
        //
        // });
        //
        this.loop();
        setTimeout(() => {
            limiter.on('empty', () => {
                this.loop();
            });
        }, 1200); //otherwise it becomes empty too quickly and queues up too much stuff
        return this;
    }

};
