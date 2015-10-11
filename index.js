#!/usr/bin/env node
'use strict';
var fs = require('fs'),
    child = require('child_process'),
    async = require('async');

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
    child.exec(this.config.command, this.analyzing.bind(this));
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
        var params = {
            type: linter.type,
            time: Date.now()
        };

        var task = function(callback) {
            this.review(this.files, this.params, function(report) {
                callback(null, {
                    type: this.params.type,
                    report: report,
                    time: Date.now() - this.params.time
                });
            }.bind(this));
        };

        tasks.push(task.bind({ files: files, params: params, review: linter.review }));
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
        console.log('\n  \x1b[33mAnalyzing with ' + log.type + ':\x1b[0m ' +
            (log.report.success ? '\x1b[32mOK\x1b[0m' : '\x1b[31m' + log.report.errors.length + ' FAILED\x1b[0m') + '' +
            ', \x1b[35m' + log.time / 1000 + 's\x1b[0m'
        );

        if (!log.report.success) {
            log.report.errors.forEach(function(error) {
                console.log('    ' + error.filename + ' (' + error.line + ':' + error.column + ')' + ' > ' + error.message);
            });

            signal = 1;
        }
    });

    if (signal) {
        console.log('\n  \x1b[33mThe review failed (if using git when add `--no-verify` to bypass)\x1b[0m');
    }

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
