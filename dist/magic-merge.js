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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const STALE_PR_LABEL = 'Stale PR';
const EXCLUDED_BRANCHES = new Set(['develop', 'master', 'release-candidate']);

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

        this.nextRequestTimeoutSeconds = 1; //this number will change based on rate limit calculations
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

        return (op, params = {}) => {
            return new Promise((resolve, reject) => {
                setTimeout(_asyncToGenerator(function* () {
                    try {
                        const result = yield op(Object.assign({}, nipples, params));

                        if (result && result.meta) {
                            const meta = result.meta;
                            if (result.meta['x-ratelimit-remaining'] > 0) {
                                const unixNow = ~~(Date.now() / 1000);
                                _this.nextRequestTimeoutSeconds = Math.max(~~((meta['x-ratelimit-reset'] - unixNow) / meta['x-ratelimit-remaining']), 1.5);
                                // console.log('magic-merge.js - queue() timeout seconds:', this.nextRequestTimeoutSeconds, 'remaining: ', meta['x-ratelimit-remaining'], 'minutes left:', ((meta['x-ratelimit-reset'] - unixNow) / 60));
                            } else {
                                    // not much i can do, next request will probably fail
                                }
                        }
                        resolve(result);
                    } catch (e) {
                        reject(e);
                    }
                }), this.nextRequestTimeoutSeconds * 1000);
            });
        };
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

                return function (_x) {
                    return _ref2.apply(this, arguments);
                };
            })()));
        })();
    }

    // thumbs up etc..
    getReaction(pr, repo, reaction) {
        var _this3 = this;

        return _asyncToGenerator(function* () {
            const queue = _this3.makeQueue(repo, pr);
            const status = (yield queue(_this3.github.reactions.getForIssue, { content: reaction })).find(function (r) {
                return r.user.login === _this3.settings.username;
            });

            if (status && status.id) {
                return status;
            }
        })();
    }

    // thumbs up etc..
    setReaction(pr, repo, reaction, value) {
        var _this4 = this;

        return _asyncToGenerator(function* () {
            const queue = _this4.makeQueue(repo, pr);

            if (value) {
                return queue(_this4.github.reactions.createForIssue, { number: pr.number, content: reaction });
            } else {
                const status = yield _this4.getReaction(pr, repo, reaction);
                if (status) {
                    return queue(_this4.github.reactions.delete, { id: status.id });
                }
            }
        })();
    }

    makeMergeComment(args) {
        var _this5 = this;

        return _asyncToGenerator(function* () {
            try {
                const [cat, poop] = yield [(0, _cats2.default)(), (0, _pooping2.default)()];

                args.body = [`☃  magicmerge by dogalant  ☃`, poop, `![poop](${ cat })`].join('\n\n');
            } catch (poo) {
                args.body = `☃  magicmerge by dogalant  ☃`;
            }
            const queue = _this5.makeQueue();
            return queue(_this5.github.issues.createComment, args);
        })();
    }

    // do work
    loop() {
        var _this6 = this;

        return _asyncToGenerator(function* () {
            _this6.github.authenticate(_this6.auth);
            yield Promise.all(_this6.settings.repos.map((() => {
                var _ref3 = _asyncToGenerator(function* (repo) {

                    const prs = yield _this6.makeQueue(repo)(_this6.github.pullRequests.getAll);

                    _this6.emit('debug', `[${ repo }] has ${ prs.length } open PRs`);

                    prs.forEach((() => {
                        var _ref4 = _asyncToGenerator(function* (pr) {
                            const queue = _this6.makeQueue(repo, pr);
                            const hasMagicLabel = (yield queue(_this6.github.issues.getIssueLabels, {
                                name: _this6.label
                            })).filter(function (l) {
                                return l.name === _this6.label;
                            }).length === 1;

                            if (EXCLUDED_BRANCHES.has(pr.head.ref)) {
                                // lets be sure we never do anything really stupid with these
                                return;
                            }

                            if (_this6.settings.stalePrDays) {
                                const now = Date.now();
                                const createdAt = new Date(pr.created_at).getTime();
                                const endTime = createdAt + 3600000 * 24 * _this6.settings.stalePrDays;

                                if (now > endTime) {
                                    // this PR has been open for longer than `ancientPrDays`
                                    _this6.emit('stale', pr, repo);
                                    try {
                                        yield queue(_this6.github.issues.addLabels, { body: [STALE_PR_LABEL] });
                                    } catch (dontCare) {}
                                }
                            }

                            if (hasMagicLabel) {
                                const status = yield queue(_this6.github.repos.getCombinedStatus, { ref: pr.head.sha });
                                if (status.state !== 'success' && status.statuses.length) {
                                    // jenkins is building
                                    _this6.emit('debug', `pr #${ pr.number } in [${ repo }] is still building`);
                                    return;
                                }

                                let reviews = yield queue(_this6.github.pullRequests.getReviews);

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

                                yield queue(_this6.github.issues.addAssigneesToIssue, {
                                    assignees: [_this6.settings.username]
                                });

                                if (notApproved) {
                                    _this6.emit('debug', `pr #${ pr.number } in [${ repo }] has changes requested`);

                                    yield Promise.all([_this6.setReaction(pr, repo, '-1', true), _this6.setReaction(pr, repo, '+1', false)]);
                                } else if (approved) {
                                    try {
                                        const mergeStatus = yield queue(_this6.github.pullRequests.merge, {
                                            commit_title: "magic merge!"
                                        });

                                        yield Promise.all([_this6.setReaction(pr, repo, '-1', false), _this6.setReaction(pr, repo, '+1', true)]);

                                        if (mergeStatus.merged) {
                                            // cool, create our comment and delete branch

                                            yield _this6.makeMergeComment({
                                                number: pr.number
                                            });

                                            yield queue(_this6.github.gitdata.deleteReference, {
                                                ref: `heads/${ pr.head.ref }`
                                            });

                                            _this6.emit('debug', `pr #${ pr.number } in [${ repo }] was merged`);
                                            _this6.emit('merged', pr, repo);
                                        } else {
                                            _this6.emit('debug', `pr #${ pr.number } in [${ repo }] could not be merged: ${ JSON.stringify(mergeStatus) }`);
                                        }
                                    } catch (notMergable) {
                                        _this6.emit('warning', `pr #${ pr.number } in [${ repo }] could not be merged: ${ JSON.stringify(notMergable) }`);
                                    }
                                } else {
                                    _this6.emit('debug', `pr #${ pr.number } in [${ repo }] has not been approved yet, skipping`);
                                }
                            } else {
                                queue(_this6.github.issues.removeAssigneesFromIssue, {
                                    body: { "assignees": [_this6.settings.username] }
                                });
                                _this6.emit('debug', `pr #${ pr.number } in [${ repo }] does not have a magic label, skipping`);
                            }
                        });

                        return function (_x3) {
                            return _ref4.apply(this, arguments);
                        };
                    })());
                });

                return function (_x2) {
                    return _ref3.apply(this, arguments);
                };
            })()));

            setTimeout(function () {
                _this6.loop();
            }, _this6.nextRequestTimeoutSeconds * 1000);
        })();
    }

    start() {
        this.ensureMagicLabels().then(() => {
            this.loop();
        });
        return this;
    }

};
;