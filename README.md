# Auditor.js
A auditor for the project

## CLI version
Coming soon

## Usage

```javascript
var Auditor = require('auditorjs');

new Auditor({
    command: 'git diff --cached --name-only --diff-filter=ACMR',
    linters: {
      jscs: ['js'],
      stylint: ['styl']
    },
    plugins: '/path/to/plugins'
});
```

## Usage pre-commit
Create pre-commit hook
```bash
cd .git/hooks
ln -s ../../node_modules/auditorjs/bin/auditor pre-commit
chmod +x pre-commit
```

Config in package.json:
```javascript
{
    ...
    "auditor": {
      "command": "git diff --cached --name-only --diff-filter=ACMR",
      "linters": {
        "jscs": ["js"],
        "stylint": ["styl"]
      },
      "plugins": "/path/to/plugins"
    }
}
```

