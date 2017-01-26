'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _jiraConnector = require('jira-connector');

var _jiraConnector2 = _interopRequireDefault(_jiraConnector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

class Jira {

    constructor(host, auth, emiter) {
        this.jira = new _jiraConnector2.default({
            host,
            basic_auth: auth
        });

        this.emiter = emiter;
    }

    transitionTo(issueKey, stateName, tryCount = 0) {
        var _this = this;

        return _asyncToGenerator(function* () {
            const list = ['To Do', 'New', 'Ready', 'In Progress', 'Code Complete', 'Reviewed'];
            let highest = { name: '', idx: -1 };

            const issue = yield _this.jira.issue.getIssue({ issueKey });

            const transitions = (yield _this.jira.issue.getTransitions({
                issueKey
            })).transitions;

            list.forEach(function (name, idx) {
                transitions.forEach(function (t) {
                    if (t.name.toLowerCase() === name.toLowerCase()) {
                        if (idx > highest.idx) {
                            highest.name = t.name;
                            highest.idx = idx;
                            highest.id = t.id;
                        }
                    }
                });
            });
            if (tryCount > list.length) {
                // something bad happen, we cant transition to required state!
                // probably because state names in jira do not match our list. make eric update them
                _this.emiter.emit('error', `Could not transition ticket ${ issueKey } to [${ stateName }], must have encountered a transition name that does not match one of these: ${ list.join(', ') }`);
            }

            if (highest.idx > -1 && issue.fields.status.name.toLowerCase() !== stateName.toLowerCase()) {
                try {
                    yield _this.jira.issue.transitionIssue({
                        issueKey,
                        transition: {
                            id: highest.id
                        }
                    });
                    yield _this.transitionTo(issueKey, stateName, tryCount++);
                } catch (e) {
                    _this.emiter.emit('error', `exception transitioning issue ${ issueKey } to [${ stateName }]: ${ e }`);
                }
            }
        })();
    }
}
exports.default = Jira;