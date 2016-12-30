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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const STALE_PR_LABEL = 'Stale PR';

exports.default = class extends _events2.default {

    // settings.org         string, org name - catalant
    // settings.interval    number, interval in ms how often to re-check for prs
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
    }

    ensureMagicLabels() {
        var _this = this;

        return _asyncToGenerator(function* () {
            yield Promise.all(_this.settings.repos.map((() => {
                var _ref = _asyncToGenerator(function* (repo) {
                    const opts = _this.optsHelper(repo);
                    try {
                        yield _this.github.issues.createLabel(opts({
                            color: '00ff00',
                            name: _this.label
                        }));
                    } catch (foo) {}

                    try {
                        yield _this.github.issues.createLabel(opts({
                            color: 'ff0000',
                            name: STALE_PR_LABEL
                        }));
                    } catch (foo) {}
                });

                return function (_x) {
                    return _ref.apply(this, arguments);
                };
            })()));
        })();
    }

    optsHelper(repo) {
        return (obj = {}) => {
            return Object.assign({}, { owner: this.settings.org, repo }, obj);
        };
    }

    getReaction(pr, repo, reaction) {
        var _this2 = this;

        return _asyncToGenerator(function* () {
            const opts = _this2.optsHelper(repo);

            // TODO: the filter here is busted. find out what it returns and fix it
            const status = (yield _this2.github.reactions.getForIssue(opts({ number: pr.number, content: reaction }))).filter(function (r) {
                return r.user.login === _this2.settings.username;
            });

            if (status.length == 1 && status[0].id) {
                return status[0];
            }
        })();
    }
    setReaction(pr, repo, reaction, value) {
        var _this3 = this;

        return _asyncToGenerator(function* () {
            const opts = _this3.optsHelper(repo);

            if (value) {
                return _this3.github.reactions.createForIssue(opts({ number: pr.number, content: reaction }));
            } else {
                const status = yield _this3.getReaction(pr, repo, reaction);
                if (status) {
                    return _this3.github.reactions.delete(opts({ id: status.id }));
                }
            }
        })();
    }

    makeMergeComment(args) {
        var _this4 = this;

        return _asyncToGenerator(function* () {
            try {
                const cat = yield (0, _cats2.default)();
                args.body = `☃  magicmerge by dogalant  ☃\n\n![poop](${ cat })`;
            } catch (poo) {
                args.body = `☃  magicmerge by dogalant  ☃`;
            }

            return _this4.github.issues.createComment(args);
        })();
    }

    loop() {
        var _this5 = this;

        return _asyncToGenerator(function* () {
            _this5.github.authenticate(_this5.auth);
            _this5.settings.repos.forEach((() => {
                var _ref2 = _asyncToGenerator(function* (repo) {

                    const opts = _this5.optsHelper(repo);

                    const prs = yield _this5.github.pullRequests.getAll(opts());

                    _this5.emit('debug', `[${ repo }] has ${ prs.length } open PRs`);

                    prs.forEach((() => {
                        var _ref3 = _asyncToGenerator(function* (pr) {
                            const hasMagicLabel = (yield _this5.github.issues.getIssueLabels(opts({
                                name: _this5.label,
                                number: pr.number
                            }))).filter(function (l) {
                                return l.name === _this5.label;
                            }).length === 1;

                            if (_this5.settings.stalePrDays) {
                                const now = Date.now();
                                const createdAt = new Date(pr.created_at).getTime();
                                const endTime = createdAt + 3600000 * 24 * _this5.settings.stalePrDays;

                                if (now > endTime) {
                                    // this PR has been open for longer than `ancientPrDays`
                                    _this5.emit('stale', pr, repo);
                                    try {
                                        _this5.github.issues.addLabels(opts({ number: pr.number, body: [STALE_PR_LABEL] }));
                                    } catch (dontCare) {}
                                }
                            }

                            if (hasMagicLabel) {
                                const status = yield _this5.github.repos.getCombinedStatus(opts({ ref: pr.head.sha }));
                                if (status.state !== 'success') {
                                    // jenkins is building 
                                    _this5.emit('debug', `pr #${ pr.number } in [${ repo }] is still building`);
                                    return;
                                }

                                let reviews = yield _this5.github.pullRequests.getReviews(opts({ number: pr.number }));

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

                                _this5.github.issues.addAssigneesToIssue(opts({
                                    number: pr.number,
                                    assignees: [_this5.settings.username]
                                }));

                                if (notApproved) {
                                    _this5.emit('debug', `pr #${ pr.number } in [${ repo }] has changes requested`);
                                    _this5.setReaction(pr, repo, '-1', true);
                                    _this5.setReaction(pr, repo, '+1', false);
                                } else if (approved) {
                                    try {
                                        const mergeStatus = yield _this5.github.pullRequests.merge(opts({
                                            number: pr.number,
                                            sha: pr.head.sha,
                                            commit_title: "magic merge!"
                                        }));

                                        _this5.setReaction(pr, repo, '-1', false);
                                        _this5.setReaction(pr, repo, '+1', true);

                                        if (mergeStatus.merged) {
                                            // cool, create our comment and delete branch

                                            _this5.makeMergeComment(opts({
                                                number: pr.number
                                            }));

                                            _this5.github.gitdata.deleteReference(opts({
                                                ref: `heads/${ pr.head.ref }`
                                            }));

                                            _this5.emit('debug', `pr #${ pr.number } in [${ repo }] was merged`);
                                            _this5.emit('merged', pr, repo);
                                        } else {
                                            _this5.emit('debug', `pr #${ pr.number } in [${ repo }] could not be merged: ${ JSON.stringify(mergeStatus) }`);
                                        }
                                    } catch (notMergable) {
                                        _this5.emit('warning', `pr #${ pr.number } in [${ repo }] could not be merged: ${ JSON.stringify(notMergable) }`);
                                    }
                                } else {
                                    _this5.emit('debug', `pr #${ pr.number } in [${ repo }] has not been approved yet, skipping`);
                                }
                            } else {
                                _this5.github.issues.removeAssigneesFromIssue(opts({
                                    number: pr.number,
                                    body: { "assignees": [_this5.settings.username] }
                                }));
                                _this5.emit('debug', `pr #${ pr.number } in [${ repo }] does not have a magic label, skipping`);
                            }
                        });

                        return function (_x3) {
                            return _ref3.apply(this, arguments);
                        };
                    })());
                });

                return function (_x2) {
                    return _ref2.apply(this, arguments);
                };
            })());
        })();
    }

    start() {
        var _this6 = this;

        return _asyncToGenerator(function* () {
            yield _this6.ensureMagicLabels();
            _this6.loop();
            return setInterval(function () {
                return _this6.loop();
            }, _this6.settings.interval);
        })();
    }

};
;