if(!module.parent) {
    // this must run with babel-node (its for testing only, not for YOU)
    const MagicMerge = require('./src/magic-merge').default;

    const magic = new MagicMerge({
        org: 'catalant',
        interval: 1000 * 15,
        repos: ['magic-merge-plz'],
        label: 'a magic merge plz',
        stalePrDays: 0,
        username: 'mkoryak',
        auth: require('./auth.json')
    });
    const timer = magic.start();

    magic.on('debug', (msg) => {
        console.log('magic-merge:', msg);
    });

    magic.on('merged', (pr, repo) => {
        console.log('MERGED!', repo, pr.number);
    });

    magic.on('stale', (pr, repo) => {
        // you will see this if a pr has been open for longer than `stalePrDays`
        console.log('stale pr', pr.number, repo);
    });

    setTimeout(() => {
        // shut off the thing in 20 mins (you should never need to do this)
        clearInterval(timer);
    }, 1000 * 60 * 20);
}

module.exports = require('./dist/magic-merge').default;
