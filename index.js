if(!module.parent) {
    // this must run with babel-node (its for testing only, not for YOU)
    const MagicMerge = require('./src/magic-merge').default;

    const magic = new MagicMerge({
        org: 'catalant',
        repos: ['hn-enterprise-portal'],
        label: 'a magic merge plz',
        stalePrDays: 0,
        username: 'catalantmagicmergecat',
        auth: require('./auth.json')
    });
    magic.start()
        .on('debug', (msg) => {
            console.log('magic-merge:', msg);
        }).on('merged', (pr, repo) => {
            console.log('MERGED!', repo, pr.number);
        }).on('stale', (pr, repo) => {
            // you will see this if a pr has been open for longer than `stalePrDays`
            console.log('stale pr', pr.number, repo);
        });
}

module.exports = require('./dist/magic-merge').default;
