var fs = require('fs'),
    jscs = require('jscs'),
    checker = new jscs({ esnext: true });

checker.registerDefaultRules();
checker.configure(require('jscs/lib/cli-config').load('.jscsrc'));

module.exports = function(files, settings, done) {
    var log = {
        success: true,
        errors: []
    };

    files.forEach(function(filename) {
        if (settings.extensions.indexOf(filename.split('.').pop()) === -1) {
            return;
        }

        try {
            var errors = checker.checkString(String(fs.readFileSync(filename)), filename),
                errorList = errors.getErrorList();

            if (errorList.length) {
                errorList.forEach(function(error) {
                    log.errors.push({
                        filename: error.filename,
                        line: error.line,
                        column: error.column,
                        rule: error.rule,
                        message: error.message
                    });
                });
            }
        } catch (error) {
            log.errors.push({
                filename: filename,
                line: 0,
                column: 0,
                rule: '',
                message: error.message
            });
        }
    });

    if (log.errors.length) {
        log.success = false;
    }

    done(log);
};
