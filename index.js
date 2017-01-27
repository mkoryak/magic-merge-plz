if(!module.parent) {
    // this must run with babel-node (its for testing only, not for YOU)
    const MagicMerge = require('./src/magic-merge').default;

    const magic = new MagicMerge({
        org: 'catalant',
        repos: [
       //     'data-api',
       //      'hn-admin',
           'hn-core',
         //   'hn-webpack',
            'hn-nerd-experience',
           'hn-enterprise-portal',
            // 'hn-marketing-sales',
            // 'hn-marketing-public',
           // 'hn-seahorse',
             'magic-merge-plz',
       //     'main-app'
        ],
        label: 'a magic merge plz',
        stalePrDays: 0,
        username: 'catalantmagicmergecat',
        auth: require('./auth.json'),
        jira: {
            host: 'gocatalant.atlassian.net',
            auth: require('./auth.json').jira
        }
    });
    magic.start().on('debug', (msg) => {
        console.log('magic-merge:', msg);
    }).on('merged', (pr, repo) => {
        console.log('MERGED!', repo, pr.number);
    }).on('stale', (pr, repo) => {
        // you will see this if a pr has been open for longer than `stalePrDays`
        console.log('stale pr', pr.number, repo);
    }).on('rate-limit', (remainingRequests, minutesUntilReset, queuedRequests) => {
        console.log(`remaining requests: [${remainingRequests}] rate reset in minutes: [${minutesUntilReset.toFixed(2)}] queued requests: ${queuedRequests}`);
    });
}

module.exports = require('./dist/magic-merge').default;
