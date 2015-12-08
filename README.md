# Reviewbot
The review bot for your repository

## Usage
```js
var reviewbot = require('reviewbot'),
    eslintbot = require('reviewbot-eslint'),
    jscsbot = require('reviewbot-jscs'),
    stylintbot = require('reviewbot-stylint');

var bot = new reviewbot({
    command: 'find ./var/www/s -name "*.js" -o -name "*.es6" -o -name "*.styl"',
    excludes: ['/node_modules', '/build'],
    linters: [
        new jscsbot({ extensions: ['.js', '.es6'] }),
        new eslintbot({ extensions: ['.js', '.es6'] }),
        new stylintbot({ extensions: ['.styl'] })
    ]
});

bot.review();
```

## Usage pre-commit
Install
```bash
npm i reviewbot reviewbot-jscs reviewbot-eslint reviewbot-stylint
```

Create pre-commit hook
```bash
cd .git/hooks
ln -s ../../node_modules/reviewbot/bin/reviewbot pre-commit
chmod +x pre-commit
```

Config in reviewbot.config.js:
```js
var eslintbot = require('reviewbot-eslint'),
    jscsbot = require('reviewbot-jscs'),
    stylintbot = require('reviewbot-stylint');

module.exports = {
    command: 'git diff --cached --name-only --diff-filter=ACMR',
    excludes: ['/node_modules', '/build'],
    linters: [
        new jscsbot({ extensions: ['.js', '.es6'] }),
        new eslintbot({ extensions: ['.js', '.es6'] }),
        new stylintbot({ extensions: ['.styl'] })
    ]
};
```

