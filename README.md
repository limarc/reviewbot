# Reviewbot
The review bot for your repository

## Usage
```js
var reviewbot = require('reviewbot'),
    rjscs = require('reviewbot-jscs'),
    rstylint = require('reviewbot-stylint');

var bot = new reviewbot({
    command: 'git diff --cached --name-only --diff-filter=ACMR',
    excludes: ['/node_modules', '/build'],
    linters: [
        new rjscs({ extensions: ['.js', '.es6'] }),
        new rstylint({ extensions: ['.styl'] })
    ]
});

bot.review();
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
var rjscs = require('reviewbot-jscs'),
    rstylint = require('reviewbot-stylint');

module.exports = {
    command: 'git diff --cached --name-only --diff-filter=ACMR',
    excludes: ['/node_modules', '/build'],
    linters: [
        new rjscs({ extensions: ['.js', '.es6'] }),
        new rstylint({ extensions: ['.styl'] })
    ]
};
```

