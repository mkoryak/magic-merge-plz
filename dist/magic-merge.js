'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _github = require('github');

var _github2 = _interopRequireDefault(_github);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = class extends _events2.default {

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
        this.github = new _github2.default({
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
    }

    ensureMagicLabels() {
        var _this = this;

        return _asyncToGenerator(function* () {
            _this.settings.repos.forEach((() => {
                var _ref = _asyncToGenerator(function* (repo) {
                    const opts = function (obj = {}) {
                        return Object.assign({}, {
                            owner: _this.settings.org,
                            repo,
                            name: _this.label
                        }, obj);
                    };
                    try {
                        yield _this.github.issues.getLabel(opts());
                    } catch (nope) {
                        // const l = await this.github.issues.createLabel(opts({
                        //     color: '00ff00'
                        // }));
                        // TODO: the above does not work for some reason. investigate!
                        _this.emit('warning', `repo ${ repo } does not have a label named [${ _this.label }]`);
                    }
                });

                return function (_x) {
                    return _ref.apply(this, arguments);
                };
            })());
        })();
    }

    loop() {
        var _this2 = this;

        return _asyncToGenerator(function* () {
            _this2.github.authenticate(_this2.auth);
            _this2.settings.repos.forEach((() => {
                var _ref2 = _asyncToGenerator(function* (repo) {

                    const opts = function (obj = {}) {
                        return Object.assign({}, { owner: _this2.settings.org, repo }, obj);
                    };

                    const prs = yield _this2.github.pullRequests.getAll(opts());

                    _this2.emit('debug', `[${ repo }] has ${ prs.length } open PRs`);

                    prs.forEach((() => {
                        var _ref3 = _asyncToGenerator(function* (pr) {
                            const hasMagicLabel = (yield _this2.github.issues.getIssueLabels(opts({
                                name: _this2.label,
                                number: pr.number
                            }))).length > 0;

                            if (_this2.settings.ancientPrDays) {
                                const now = Date.now();
                                const createdAt = new Date(pr.created_at).getTime();
                                const endTime = createdAt + 3600000 * 24 * _this2.settings.stalePrDays;
                                if (now > endTime) {
                                    // this PR has been open for longer than `ancientPrDays`
                                    _this2.emit('stale', pr, repo);
                                }
                            }

                            if (hasMagicLabel) {
                                const reviews = yield _this2.github.pullRequests.getReviews(opts({ number: pr.number }));

                                const approved = reviews.find(function (t) {
                                    return t.state === 'APPROVED';
                                });

                                if (approved) {
                                    const mergeStatus = yield _this2.github.pullRequests.merge(opts({
                                        number: pr.number,
                                        sha: pr.head.sha,
                                        commit_title: "magic merge!"
                                    }));

                                    if (mergeStatus.merged) {
                                        // cool, create our comment and delete branch

                                        _this2.github.issues.createComment(opts({
                                            number: pr.number,
                                            body: '☃  magicmerge by dogalant  ☃'
                                        }));

                                        _this2.github.gitdata.deleteReference(opts({
                                            ref: `heads/${ pr.head.ref }`
                                        }));

                                        _this2.emit('debug', `pr #${ pr.number } in [${ repo }] was merged`);
                                        _this2.emit('merged', pr, repo);
                                    } else {
                                        _this2.emit('debug', `pr #${ pr.number } in [${ repo }] could not be merged: ${ JSON.stringify(mergeStatus) }`);
                                    }
                                } else {
                                    _this2.emit('debug', `pr #${ pr.number } in [${ repo }] has not been approved yet, skipping`);
                                }
                            } else {
                                _this2.emit('debug', `pr #${ pr.number } in [${ repo }] does not have a magic label, skipping`);
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
        var _this3 = this;

        return _asyncToGenerator(function* () {
            yield _this3.ensureMagicLabels();
            return setInterval(function () {
                return _this3.loop();
            }, _this3.settings.interval);
        })();
    }

};
;