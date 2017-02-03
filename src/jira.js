import JiraClient from 'jira-connector';

export default class Jira {

    constructor(host, auth, emitter) {
        this.jira = new JiraClient( {
            host,
            basic_auth: auth
        });
        this.jiraHost = host;

        this.emitter = emitter;
    }

    getTicketName(pr) {
        const prName = pr.head.label.split(':')[1];
        return prName.match(/(CA?T-\d+)/i) && RegExp.$1 && RegExp.$1.toUpperCase();
    }

    getBranchPreviewLink(branchName) {
        return `github-windows://${branchName}`;
    }

    async addComment(ticket, comment) {
        return this.jira.issue.addComment({issueKey: ticket, comment})
    }

    async updateBranchPreviewLink(pr) {
        const ticket = this.getTicketName(pr);
        const branchName = pr.head.label.split(':')[1];
        if (ticket) {
            const fields = (await this.jira.issue.getEditMetadata({issueKey: ticket})).fields;
            const field = fields && Object.values(fields).find(f => f.name === 'Branch preview link');
            if (field) {
                const arg = {
                    issueKey: ticket,
                    issue: {
                        fields: {
                            [field.key]: this.getBranchPreviewLink(branchName)
                        }
                    }
                };
                this.jira.issue.editIssue(arg);
            }
        }
    }


    async getIssue(pr) {
        const ticket = this.getTicketName(pr);
        if (ticket) {
            return this.jira.issue.getIssue({issueKey: ticket});
        }
    }

    async getTicketSummary(ticket, branchName) {
        const issue = await this.jira.issue.getIssue({issueKey: ticket});
        const icon = `![${issue.fields.issuetype.name}](${issue.fields.issuetype.iconUrl})`;
        const link = `[${ticket}](https://${this.jiraHost}/browse/${ticket})`;
        const previewLink = `[branch preview](${this.getBranchPreviewLink(branchName)})`;
        return [
            `${icon} ${link} | ${previewLink}`,
            issue.fields.summary.trim()
        ].join('\n\n');
    }

    async transitionTo(issueKey, stateName, tryCount=0) {
        return;

        const list = ['New', 'Ready', 'In Progress', 'Product Review', 'Code Review', 'Closed'];
        let highest = {name: '', idx: -1};

        const issue = await this.jira.issue.getIssue({issueKey});

        const transitions = (await this.jira.issue.getTransitions({
            issueKey
        })).transitions;

        list.forEach((name, idx) => {
            transitions.forEach(t => {
                if (t.name.toLowerCase() === name.toLowerCase()) {
                    if (idx > highest.idx) {
                        highest.name = t.name;
                        highest.idx = idx;
                        highest.id = t.id
                    }
                }
            });
        });
        if (tryCount > list.length) {
            // something bad happen, we cant transition to required state!
            // probably because state names in jira do not match our list. make eric update them
            this.emitter.emit('error', `Could not transition ticket ${issueKey} to [${stateName}], must have encountered a transition name that does not match one of these: ${list.join(', ')}`)
        }

        if (highest.idx > -1 && issue.fields.status.name.toLowerCase() !== stateName.toLowerCase()) {
            try {
                await this.jira.issue.transitionIssue({
                    issueKey,
                    transition: {
                        id: highest.id
                    }
                });
                await this.transitionTo(issueKey, stateName, tryCount++);
            } catch(e) {
                this.emitter.emit('error', `exception transitioning issue ${issueKey} to [${stateName}]: ${e}`);
            }

        }
    }
}

