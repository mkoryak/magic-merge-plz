sadgfa
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
