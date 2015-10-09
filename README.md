# Reviewbot
The review bot for your repository

## Usage
```js
var Reviewbot = require('reviewbot'),
    rmyplugin = require('reviewbot-myplugin');

var reviewbot = new Reviewbot({
    command: 'git diff --cached --name-only --diff-filter=ACMR',
    excludes: ['/node_modules', '/build'],
    plugins: [
        new Reviewbot.linters.rjscs(),
        new Reviewbot.linters.rstyl(),
        new rmyplugin()
    ]
});

reviewbot.lint();
```

## Usage pre-commit
Create pre-commit hook
```bash
cd .git/hooks
ln -s ../../node_modules/reviewbot/bin/reviewbot pre-commit
chmod +x pre-commit
```

Config in reviewbot.config.js:
```js
var reviewbot = require('reviewbot'),
    rjscs = require('reviewbot-jscs'),
    rstylint = require('reviewbot-stylint');

module.exports = {
    command: 'git diff --cached --name-only --diff-filter=ACMR',
    excludes: ['/node_modules', '/build'],
    linters: [
        new rjscs(),
        new rstylint()
    ]
};
```

