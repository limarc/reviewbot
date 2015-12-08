#!/usr/bin/env node
'use strict';
var fs = require('fs'),
    child = require('child_process'),
    async = require('async'),
    chalk = require('chalk'),
    Spinner = require('cli-spinner').Spinner;

/**
 * Creating spinner
 */
var spinner = new Spinner('Running reviewbot.. %s');
spinner.setSpinnerString('|/-\\');

/**
 * Reviewbot
 *
 * @param {Object} config The config
 */
var Reviewbot = function(config) {
    this.config = {
        command: 'git diff --cached --name-only --diff-filter=ACMR',
        excludes: ['/node_modules'],
        linters: []
    };

    this.loadConfigFile();
    this.configure(config);
};

/**
 * Load config from file
 *
 * @param {string} path The relative path to config
 */
Reviewbot.prototype.loadConfigFile = function(path) {
    if (!path) {
        path = process.cwd() + '/reviewbot.config.js';
    }

    try {
        if (fs.statSync(path).isFile()) {
            this.configure(require(path));
        }
    } catch (e) {}
};

/**
 * Merge config
 *
 * @param {Object} config The config
 */
Reviewbot.prototype.configure = function(config) {
    if (config && config.constructor === Object) {
        for (var type in config) {
            this.config[type] = config[type];
        }
    }
};

/**
 * Review
 */
Reviewbot.prototype.review = function() {
    var that = this;

    spinner.start();
    child.exec(that.config.command, function(error, stdout, stderr) {
        spinner.stop(true);
        that.analyzing(error, stdout, stderr);
    });
};

/**
 * Analyzing
 *
 * @param {Mixed} error Flag
 * @param {Buffer} stdout Result
 * @param {Buffer} stderr Error
 */
Reviewbot.prototype.analyzing = function(error, stdout, stderr) {
    if (error !== null) {
        throw new Error('The reviewbot is failed: ' + error);
    }

    var that = this;
    var tasks = [];

    var files = String(stdout).trim().split('\n').reduce(function(result, filename) {
        var status = that.config.excludes.some(function(pattern) {
            return filename.indexOf(pattern) !== -1;
        });

        if (!status) {
            result.push(filename);
        }

        return result;
    }, []);

    (this.config.linters || []).forEach(function(linter) {
        var task = function(callback) {
            this.review(this.files, function(report) {
                callback(null, {
                    type: this.type,
                    report: report,
                    time: Date.now() - this.time
                });
            }.bind(this));
        };

        tasks.push(task.bind({ files: files, type: linter.type, time: Date.now(), review: linter.review }));
    });

    async.parallel(tasks, function(undefined, logs) {
        this.signal(this.reporter(logs));
    }.bind(this));
};

/**
 * Reporter
 *
 * @param {Object} type The collection logs
 * @returns The return status code
 */
Reviewbot.prototype.reporter = function(logs) {
    var signal = 0;

    logs.forEach(function(log) {
        console.log('  ' +
            chalk.yellow('Analyzing with ' + log.type) + chalk.gray(': ') +
            (log.report.success ? chalk.green('Ok') : chalk.red(log.report.errors.length + ' Failed')) + chalk.gray(', ') +
            chalk.magenta(log.time / 1000 + 's')
        );

        if (!log.report.success) {
            var group = log.report.errors.reduce(function(result, error) {
                if (!result[error.filename]) {
                    result[error.filename] = [];
                }

                result[error.filename].push(error);
                return result;
            }, {});

            for (var name in group) {
                if (!group.hasOwnProperty(name)) {
                    continue;
                }

                console.log('    ' + chalk.underline(name));

                group[name].forEach(function(error) {
                    console.log(
                        '      ' +
                        error.message + '' +
                        (error.rule ? ' [' + error.rule + ']' : '') +
                        chalk.gray(', ' + error.line + ':' + error.column + '')
                    );
                });

                console.log('');
            }

            signal = 1;
        }
    });

    if (signal) {
        console.log('  ' + chalk.yellow('The review failed (if using git when add `--no-verify` to bypass)'));
    }

    console.log('');

    return signal;
};

/**
 * Signal
 */
Reviewbot.prototype.signal = function(code) {
    var that = this;

    if (process.stdout._pendingWriteReqs || process.stderr._pendingWriteReqs) {
        process.nextTick(function() {
            that.signal(code);
        });
    } else {
        process.exit(code);
    }
};

module.exports = Reviewbot;
