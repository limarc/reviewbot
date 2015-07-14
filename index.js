#!/usr/bin/env node
'use strict';

var fs = require('fs'),
    async = require('async'),
    child = require('child_process');

/**
 * Auditor
 * @param {Object} config The config
 */
var Auditor = function(config) {
    this.config = {
        command: 'git diff --cached --name-only --diff-filter=ACMR',
        linters: {
            jscs: ['js'],
            jshint: ['js'],
            stylint: ['styl']
        },
        plugins: false
    };

    this.auditors = {};

    // Configure
    this.configure(config);
    this.configure(require(process.cwd() + '/package.json').scripts.auditor);

    // Loading plugins
    this.plugins(__dirname + '/src/auditors');

    if (this.config.plugins) {
        this.plugins(process.cwd() + '/' + this.config.plugins);
    }

    // Get filelist by exec command
    child.exec(this.config.command, this.analyzing.bind(this));
};

/**
 * Merge config
 * @param {Object} config The config
 */
Auditor.prototype.configure = function(config) {
    if (config && config.constructor === Object) {
        for (var type in config) {
            this.config[type] = config[type];
        }
    }
};

/**
 * Analyzing
 *
 * @param {Mixed} error Flag
 * @param {Buffer} stdout Result
 * @param {Buffer} stderr Error
 */
Auditor.prototype.analyzing = function(error, stdout, stderr) {
    if (error !== null) {
        throw new Error('The auditor.js is failed: ' + error);
    }

    var that = this,
        files = String(stdout).trim().split('\n'),
        tasks = [];

    for (var type in this.auditors) {
        if (!this.config.linters[type]) {
            continue;
        }

        var settings = {
            type: type,
            extensions: this.config.linters[type],
            time: new Date().getTime()
        };

        var task = function(callback) {
            that.auditors[this.settings.type](this.files, this.settings, function(report) {
                callback(null, { type: this.settings.type, report: report, time: new Date().getTime() - this.settings.time });
            }.bind(this));
        };

        tasks.push(task.bind({ files: files, settings: settings }));
    }

    async.parallel(tasks, function(undefined, logs) {
        that.exit(that.reporter(logs));
    });
};

/**
 * Load `*.js` plugins in specified directory as properties
 * @param {string} path The path to directory
 */
Auditor.prototype.plugins = function(path) {
    if (!fs.existsSync(path)) {
        return false;
    }

    var that = this;

    fs.readdirSync(path).forEach(function(filename) {
        if (filename !== 'index.js') {
            that.auditors[filename.replace('.js', '')] = require(path + '/' + filename);
        }
    });
};

/**
 * Reporter
 *
 * @param {Object} type The collection logs
 * @returns The return status code
 */
Auditor.prototype.reporter = function(logs) {
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
        console.log('\n  \x1b[33mThe checkout failed (if using git when add `--no-verify` to bypass)\x1b[0m');
    }

    return signal;
};

/**
 * Flush exit
 * @see https://gist.github.com/3427357
 */
Auditor.prototype.exit = function(code) {
    if (process.stdout._pendingWriteReqs || process.stderr._pendingWriteReqs) {
        process.nextTick(function() {
            exit(code);
        });
    } else {
        process.exit(code);
    }
};

module.exports = Auditor;
