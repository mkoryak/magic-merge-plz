'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _jiraConnector = require('jira-connector');

var _jiraConnector2 = _interopRequireDefault(_jiraConnector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

class Jira {

    constructor(host, auth, emitter) {
        this.jira = new _jiraConnector2.default({
            host,
            basic_auth: auth
        });
        this.jiraHost = host;

        this.emitter = emitter;
    }

    getTicketName(pr) {
        const prName = pr.head.label.split(':')[1];
        return prName.match(/(CAT-\d+)/i) && RegExp.$1 && RegExp.$1.toUpperCase();
    }

    getBranchPreviewLink(branchName) {
        return `github-windows://${ branchName }`;
    }

    addComment(ticket, comment) {
        var _this = this;

        return _asyncToGenerator(function* () {
            return _this.jira.issue.addComment({ issueKey: ticket, comment });
        })();
    }

    updateBranchPreviewLink(pr) {
        var _this2 = this;

        return _asyncToGenerator(function* () {
            const ticket = _this2.getTicketName(pr);
            const branchName = pr.head.label.split(':')[1];
            if (ticket) {
                const fields = (yield _this2.jira.issue.getEditMetadata({ issueKey: ticket })).fields;
                const field = Object.values(fields).find(function (f) {
                    return f.name === 'Branch preview link';
                });
                if (field) {
                    const arg = {
                        issueKey: ticket,
                        issue: {
                            fields: {
                                [field.key]: _this2.getBranchPreviewLink(branchName)
                            }
                        }
                    };
                    yield _this2.jira.issue.editIssue(arg);
                }
            }
        })();
    }

    getIssue(pr) {
        var _this3 = this;

        return _asyncToGenerator(function* () {
            const ticket = _this3.getTicketName(pr);
            if (ticket) {
                return _this3.jira.issue.getIssue({ issueKey: ticket });
            }
        })();
    }

    getTicketSummary(ticket, branchName) {
        var _this4 = this;

        return _asyncToGenerator(function* () {
            const issue = yield _this4.jira.issue.getIssue({ issueKey: ticket });
            const icon = `![${ issue.fields.issuetype.name }](${ issue.fields.issuetype.iconUrl })`;
            const link = `[${ ticket }](https://${ _this4.jiraHost }/browse/${ ticket })`;
            const previewLink = `[branch preview](${ _this4.getBranchPreviewLink(branchName) })`;
            return [`${ icon } ${ link } | ${ previewLink }`, issue.fields.summary.trim()].join('\n\n');
        })();
    }

    transitionTo(issueKey, stateName, tryCount = 0) {
        var _this5 = this;

        return _asyncToGenerator(function* () {
            const list = ['To Do', 'New', 'Ready', 'In Progress', 'Code Complete', 'Reviewed'];
            let highest = { name: '', idx: -1 };

            const issue = yield _this5.jira.issue.getIssue({ issueKey });

            const transitions = (yield _this5.jira.issue.getTransitions({
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
                _this5.emitter.emit('error', `Could not transition ticket ${ issueKey } to [${ stateName }], must have encountered a transition name that does not match one of these: ${ list.join(', ') }`);
            }

            if (highest.idx > -1 && issue.fields.status.name.toLowerCase() !== stateName.toLowerCase()) {
                try {
                    yield _this5.jira.issue.transitionIssue({
                        issueKey,
                        transition: {
                            id: highest.id
                        }
                    });
                    yield _this5.transitionTo(issueKey, stateName, tryCount++);
                } catch (e) {
                    _this5.emitter.emit('error', `exception transitioning issue ${ issueKey } to [${ stateName }]: ${ e }`);
                }
            }
        })();
    }
}
exports.default = Jira;