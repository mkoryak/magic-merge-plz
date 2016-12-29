# magic-merge-plz
automate github branch merging.

This thing checks your github repos for PRs which are APPROVED and have a magic label added to them.
If it finds such PRs it will merge them and delete the branch.

It is useful if you have things that run which prevent merging until they complete, and people have to
constantly go back and check their status before doing the merge.

# using

The export of this thing is a class named MagicMerge

the constructor takes a settings object:

```js
{
    org, // string, org name - catalant
    interval, // number, interval in ms how often to re-check for prs
    repos, // array, array of repo names in org to check
    label, // string, magic label name, defaults to 'a magic merge plz'
    auth, // object, auth object with {username, password} or {token}
    stalePrDays // number, number of days a pr should stay open to get an alert about it
}
```

the instance of MagicMerge is an EventEmitter, it emits the following events:

- debug (args: message)
- merged (args: pr, repo)
- stale (args: pr, repo)
- warning (args: message)

# example

```js
import MagicMerge from 'magic-merge-plz';

const magic = new MagicMerge({
    org: 'catalant',
    interval: 1000 * 60,
    repos: ['magic-merge-plz', 'hn-webpack', 'hn-nerd-experience', 'hn-enterprise-portal', 'hn-marketing-sales'],
    label: 'a magic merge plz',
    stalePrDays: 1,
    auth: require('./auth.json')
});

// start checking the repos for PRs with the magic merge label which are approved
const timer = m.start();

magic.on('debug', (msg) => {
    console.log('magic-merge:', msg);
});

magic.on('merged', (pr, repo) => {
    console.log('MERGED!', repo, pr.number);
});

magic.on('stale', (pr, repo) => {
    // you will see this if a pr has been open for longer than `stalePrDays`
    console.log('stale pr', pr, repo);
});

setTimeout(() => {
    // shut off the thing in 20 mins (you should never need to do this)
    clearInterval(timer);
}, 1000 * 60 * 20);

```
