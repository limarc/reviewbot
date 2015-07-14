var fs = require('fs'),
    jshint = require('jshint').JSHINT,
    config = {};

if (fs.existsSync('./.jshintrc')) {
    config = JSON.parse(fs.readFileSync('./.jshintrc', 'utf8'));
}

module.exports = function(files, settings, done) {
    var log = {
        success: true,
        errors: []
    };

    files.forEach(function(filename) {
        if (settings.extensions.indexOf(filename.split('.').pop()) === -1) {
            return;
        }

        jshint(filename, config);

        var errors = jshint.data().errors;
        if (errors && errors.length > 0) {
            errors.forEach(function(error) {
                log.errors.push({
                    filename: error.evidence,
                    line: error.line,
                    column: error.character,
                    rule: error.code,
                    message: error.reason
                });
            });
        }
    });

    if (log.errors.length) {
        log.success = false;
    }

    done(log);
};
