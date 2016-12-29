if(!module.parent) {
    // this must run with babel-node (its for testing only, not for YOU)
    const MagicMerge = require('./src/magic-merge').default;

    const magic = new MagicMerge({
        org: 'catalant',
        interval: 1000 * 30,
        repos: ['hn-webpack', 'magic-merge-plz', 'hn-nerd-experience', 'hn-enterprise-portal', 'hn-marketing-sales'],
        label: 'a magic merge plz',
        stalePrDays: 5,
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

const MagicMerge = require('./dist/magic-merge').default;
export default MagicMerge;
