var fs = require('fs'),
    spawn = require('child_process').spawn,
    async = require('async'),
    command = require.resolve('stylint').replace(/index\.js$/, 'bin/stylint')
    config = {};

if (fs.existsSync('./.stylintrc')) {
    config = JSON.parse(fs.readFileSync('./.stylintrc', 'utf8'));
}

module.exports = function(files, settings, done) {
    var log = {
        success: true,
        errors: []
    };

    var streams = [];

    files.forEach(function(filename) {
        if (settings.extensions.indexOf(filename.split('.').pop()) === -1) {
            return;
        }

        var args = [filename, ' --config', config, ' --strict'];

        streams.push(function(callback) {
            var filename = this.filename,
                errors = [];

            try {
                //'stylint path/to/styl/ -c .stylintrc'
                var lint = spawn(command, args);
                lint.stdout.setEncoding('utf8');
                lint.stderr.setEncoding('utf8');

                lint.stdout.on('data', function(data) {
                    var raw = String(data).trim().split('\n\n'),
                        stats = raw.pop(-1);

                    raw.forEach(function(block) {
                        var x = block.split('\n'),
                            line = x[2].replace('Line: ', '').split(':');

                        errors.push({
                            filename: filename,
                            line: String(line[0]),
                            column: 0,
                            rule: '',
                            message: x[0] + ' (' + String(line[1]).trim() + ')'
                        });
                    });
                });

                lint.stderr.on('data', function(data) {
                    errors.push({
                        filename: filename,
                        line: 0,
                        column: 0,
                        rule: '',
                        message: String(data).trim()
                    });
                });

                lint.on('close', function() {
                    callback(null, errors);
                });
            } catch (error) {
                errors.push({
                    filename: filename,
                    line: 0,
                    column: 0,
                    rule: '',
                    message: String(error.message).trim()
                });

                callback(null, errors);
            }
        }.bind({ filename: filename, args: args }));
    });

    async.parallel(streams, function(undefined, result) {
        var log = {
            success: true,
            errors: []
        };

        result.forEach(function(collection) {
            collection.forEach(function(error) {
                log.errors.push(error);
            });
        });

        if (log.errors.length) {
            log.success = false;
        }

        done(log);
    });
};
