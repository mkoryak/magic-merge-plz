'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _github = require('github');

var _github2 = _interopRequireDefault(_github);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _cats = require('./cats');

var _cats2 = _interopRequireDefault(_cats);

var _pooping = require('./pooping');

var _pooping2 = _interopRequireDefault(_pooping);

var _bottleneck = require('bottleneck');

var _bottleneck2 = _interopRequireDefault(_bottleneck);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const STALE_PR_LABEL = 'Stale PR';
const EXCLUDED_BRANCHES = new Set(['develop', 'master', 'release-candidate']);

const limiter = new _bottleneck2.default(2, 1500);

const PRIORITY = {
    INSANE: -1, //actually skip the queue, just do it and hope we dont run out of requests
    HIGHEST: 0,
    HIGH: 3,
    NORMAL: 5,
    WHATEVS: 10
};

exports.default = class extends _events2.default {

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

        this.github = new _github2.default({
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
    }

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
        var _this = this;

        const nipples = {
            owner: this.settings.org
        };
        repo && (nipples.repo = repo);
        pr && (nipples.number = pr.number);

        const fn = (() => {
            var _ref = _asyncToGenerator(function* (op, params = {}, priority = PRIORITY.NORMAL) {
                if (params instanceof Number) {
                    priority = params;
                    params = {};
                }

                try {
                    let result;
                    const arg = Object.assign({}, nipples, params);

                    if (priority == PRIORITY.INSANE) {
                        _this.emit('debug', 'insane priority request happened, it should not happen often');
                        result = yield op(arg);
                    } else {
                        result = yield limiter.schedulePriority(priority, op, arg);
                    }

                    if (result && result.meta) {
                        const meta = result.meta;
                        if (result.meta['x-ratelimit-remaining'] > 0) {
                            const unixNow = ~~(Date.now() / 1000);
                            _this.emit('rate-limit', meta['x-ratelimit-remaining'], (meta['x-ratelimit-reset'] - unixNow) / 60, limiter.nbQueued());
                        }
                    }
                    return result;
                } catch (e) {
                    _this.emit('error', e);
                }
            });

            return function fn(_x) {
                return _ref.apply(this, arguments);
            };
        })();
        fn.$key = pr ? pr.head.ref : 'poop';
        return fn;
    }

    /**
     * make sure that each repo we monitor has the labels we plan to use
     */
    ensureMagicLabels() {
        var _this2 = this;

        return _asyncToGenerator(function* () {

            yield Promise.all(_this2.settings.repos.map((() => {
                var _ref2 = _asyncToGenerator(function* (repo) {
                    const queue = _this2.makeQueue(repo);
                    try {
                        yield queue(_this2.github.issues.createLabel, {
                            color: '00ff00',
                            name: _this2.label
                        });
                    } catch (foo) {}

                    try {
                        yield queue(_this2.github.issues.createLabel, {
                            color: 'ff0000',
                            name: STALE_PR_LABEL
                        });
                    } catch (foo) {}
                });

                return function (_x2) {
                    return _ref2.apply(this, arguments);
                };
            })()));
        })();
    }

    // thumbs up etc..
    getReaction(queue, reaction, priority = PRIORITY.NORMAL) {
        var _this3 = this;

        return _asyncToGenerator(function* () {
            const list = yield queue(_this3.github.reactions.getForIssue, { content: reaction }, priority);
            const status = list.find(function (r) {
                return r.user.login === _this3.settings.username;
            });
            if (status && status.id) {
                return status;
            }
        })();
    }

    // thumbs up etc..
    setReaction(queue, reaction, value, priority = PRIORITY.NORMAL) {
        var _this4 = this;

        return _asyncToGenerator(function* () {
            if (value) {
                return queue(_this4.github.reactions.createForIssue, { content: reaction }, priority);
            } else {
                const status = yield _this4.getReaction(pr, repo, reaction, priority);
                if (status) {
                    return queue(_this4.github.reactions.delete, { id: status.id }, priority);
                }
            }
        })();
    }

    makeMergeComment(args) {
        var _this5 = this;

        return _asyncToGenerator(function* () {
            try {
                const [cat, poop] = yield Promise.all([(0, _cats2.default)(), (0, _pooping2.default)()]);

                args.body = [`☃  magicmerge by dogalant  ☃`, poop, `![poop](${ cat })`].join('\n\n');
            } catch (poo) {
                args.body = `☃  magicmerge by dogalant  ☃`;
            }
            const queue = _this5.makeQueue();
            return queue(_this5.github.issues.createComment, args, PRIORITY.INSANE);
        })();
    }

    /**
     * add a `comment` ONLY if `reactionName` has not been added to the PR (by settings.username)
     */
    addConditionalComment(queue, reactionName, comment, beInsane) {
        var _this6 = this;

        return _asyncToGenerator(function* () {
            const key = queue.$key + reactionName;
            if (!_this6.conditionalComments[key]) {
                _this6.conditionalComments[key] = true;
                // dont let them make the original request insanely, as it might happen more than ONCE
                const notified = yield _this6.getReaction(queue, reactionName);
                if (!notified) {
                    const priority = beInsane ? PRIORITY.INSANE : PRIORITY.NORMAL;
                    yield _this6.setReaction(queue, reactionName, true, priority);
                    queue(_this6.github.issues.createComment, { body: comment }, priority);
                }
            }
        })();
    }

    // do work
    loop() {
        var _this7 = this;

        return _asyncToGenerator(function* () {
            _this7.github.authenticate(_this7.auth);
            _this7.settings.repos.map((() => {
                var _ref3 = _asyncToGenerator(function* (repo) {

                    const prs = (yield _this7.makeQueue(repo)(_this7.github.pullRequests.getAll, PRIORITY.HIGHEST)) || [];

                    _this7.emit('debug', `[${ repo }] has ${ prs.length } open PRs`);

                    prs.forEach((() => {
                        var _ref4 = _asyncToGenerator(function* (pr) {

                            const queue = _this7.makeQueue(repo, pr);
                            const hasMagicLabel = (yield queue(_this7.github.issues.getIssueLabels, {
                                name: _this7.label
                            }, PRIORITY.HIGH)).filter(function (l) {
                                return l.name === _this7.label;
                            }).length === 1;

                            if (EXCLUDED_BRANCHES.has(pr.head.ref)) {
                                // lets be sure we never do anything really stupid with these
                                return;
                            }

                            if (_this7.settings.stalePrDays) {
                                const now = Date.now();
                                const createdAt = new Date(pr.created_at).getTime();
                                const endTime = createdAt + 3600000 * 24 * _this7.settings.stalePrDays;

                                if (now > endTime) {
                                    // this PR has been open for longer than `ancientPrDays`
                                    _this7.emit('stale', pr, repo);
                                    try {
                                        yield queue(_this7.github.issues.addLabels, { body: [STALE_PR_LABEL] }, PRIORITY.WHATEVS);
                                    } catch (dontCare) {}
                                }
                            }

                            if (hasMagicLabel) {
                                const prName = pr.head.label.split(':')[1];
                                const prType = prName.split('/')[0].toLowerCase();
                                const prBase = pr.base.ref;

                                if ((prType === 'hotfix' || prType === 'cr') && prBase !== 'master') {
                                    _this7.addConditionalComment(queue, '-1', `a *${ prType }* pull request should probably *BE* against master, you silly cod`, PRIORITY.INSANE);
                                }
                                if (prType === 'feature' && prBase === 'master') {
                                    _this7.addConditionalComment(queue, '+1', `a *feature* pull request should probably *NOT BE* against master you silly codling`);
                                }

                                // this doesnt need to happen. it wont let us merge anyway. dont waste an api request..
                                //
                                // const status = await queue(this.github.repos.getCombinedStatus, {ref: pr.head.sha}, PRIORITY.HIGH);
                                // if (status.state !== 'success' && status.statuses.length) {
                                //     // jenkins is building
                                //     this.emit('debug', `pr #${pr.number} in [${repo}] is still building`);
                                //     return;
                                // }

                                let reviews = yield queue(_this7.github.pullRequests.getReviews, PRIORITY.HIGH);

                                const lastReviews = {};

                                reviews.forEach(function (r) {
                                    let last = lastReviews[r.user.login];
                                    const date = new Date(r.submitted_at).getTime();
                                    if (last) {
                                        if (last.date < date) {
                                            lastReviews[r.user.login] = {
                                                date,
                                                state: r.state
                                            };
                                        }
                                    } else {
                                        lastReviews[r.user.login] = {
                                            date,
                                            state: r.state
                                        };
                                    }
                                });
                                // reviews returns entire history, so we only care about the last review of a
                                // given user
                                reviews = Object.values(lastReviews);

                                const approved = reviews.find(function (t) {
                                    return t.state === 'APPROVED';
                                });
                                const notApproved = reviews.find(function (t) {
                                    return t.state === 'CHANGES_REQUESTED';
                                });

                                if (!_this7.selfAssinged[queue.$key]) {
                                    queue(_this7.github.issues.addAssigneesToIssue, {
                                        assignees: [_this7.settings.username]
                                    });
                                    _this7.selfAssinged[queue.$key] = true;
                                }

                                if (notApproved) {
                                    _this7.emit('debug', `pr #${ pr.number } in [${ repo }] has changes requested`);
                                } else if (approved) {
                                    try {
                                        const mergeStatus = yield queue(_this7.github.pullRequests.merge, {
                                            commit_title: "magic merge!"
                                        }, PRIORITY.INSANE);

                                        if (mergeStatus.merged) {
                                            // cool, create our comment and delete branch

                                            yield _this7.makeMergeComment({
                                                number: pr.number,
                                                repo: repo
                                            });

                                            yield queue(_this7.github.gitdata.deleteReference, {
                                                ref: `heads/${ pr.head.ref }`
                                            }, PRIORITY.INSANE);

                                            _this7.emit('debug', `pr #${ pr.number } in [${ repo }] was merged`);
                                            _this7.emit('merged', pr, repo);
                                        } else {
                                            _this7.emit('debug', `pr #${ pr.number } in [${ repo }] could not be merged: ${ JSON.stringify(mergeStatus) }`);
                                        }
                                    } catch (notMergable) {
                                        _this7.emit('warning', `pr #${ pr.number } in [${ repo }] could not be merged: ${ JSON.stringify(notMergable) }`);
                                    }
                                } else {
                                    _this7.emit('debug', `pr #${ pr.number } in [${ repo }] has not been approved yet, skipping`);
                                }
                            } else {
                                if (_this7.selfAssinged[queue.$key]) {
                                    queue(_this7.github.issues.removeAssigneesFromIssue, {
                                        body: { "assignees": [_this7.settings.username] }
                                    }, PRIORITY.WHATEVS);
                                    _this7.selfAssinged[queue.$key] = false;
                                }
                                _this7.emit('debug', `pr #${ pr.number } in [${ repo }] does not have a magic label, skipping`);
                            }
                        });

                        return function (_x4) {
                            return _ref4.apply(this, arguments);
                        };
                    })());
                });

                return function (_x3) {
                    return _ref3.apply(this, arguments);
                };
            })());
        })();
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
        }, 2000); //otherwise it becomes empty too quickly and queues up too much stuff
        return this;
    }

};
;