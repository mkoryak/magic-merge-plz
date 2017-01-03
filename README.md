# magic-merge-plz
automate github branch merging.

This thing checks your github repos for PRs which are APPROVED and have a magic label added to them.
If it finds such PRs it will merge them and delete the branch.

It is useful if you have things that run which prevent merging until they complete, and people have to
constantly go back and check their status before doing the merge.

# Other things it does

- if a PR has any "changes requested" things, it will thumb down the PR
- if a PR has no "changes requested" and at least one approval, it will thumb up the PR
- if the magic label is added to a PR it will add itself as an asignee, and remove itself if label is removed
- there is an option to have it mark stale PRs with "Stale PR" label.

# Requirements
node 6+

# Installing

`npm install magic-merge-plz`

# Using

The export of this thing is a class named MagicMerge

the constructor takes a settings object:

```js
{
    settings.org         string, org name - catalant
    settings.repos       array, array of repo names in org to check
    settings.label       string, magic label name, defaults to 'a magic merge plz'
    settings.user        string, username of user who will be acting on behalf of magic-merge
    settings.auth        object, auth object with {password} or {token}
    settings.stalePrDays number, number of days a pr should stay open to get an emitted event about it
}
```

the instance of MagicMerge is an EventEmitter, it emits the following events:

- debug (args: message)
- merged (args: pr, repo)
- stale (args: pr, repo)
- warning (args: message)

# Example

```js
import MagicMerge from 'magic-merge-plz';

const magic = new MagicMerge({
    org: 'catalant',
    repos: ['magic-merge-plz', 'hn-webpack', 'hn-nerd-experience', 'hn-enterprise-portal', 'hn-marketing-sales'],
    label: 'a magic merge plz',
    stalePrDays: 1,
    username: 'catman',
    auth: require('./auth.json')
});

// start checking the repos for PRs with the magic merge label which are approved
magic.start().on('debug', (msg) => {
    console.log('magic-merge:', msg);
}).on('warning', (msg) => {
    console.log('magic-merge WARN:', msg);
}).on('merged', (pr, repo) => {
    console.log('MERGED!', repo, pr.number);
}).on('stale', (pr, repo) => {
    // you will see this if a pr has been open for longer than `stalePrDays`
    console.log('stale pr', pr, repo);
});

setTimeout(() => {
    // shut off the thing in 20 mins (you should never need to do this)
    clearInterval(timer);
}, 1000 * 60 * 20);

```
