/*jslint node: true */
"use strict";
var check_daemon = require('trustnote-pow-common/check_daemon.js');

check_daemon.checkDaemonAndRestart('node explorer.js', 'node explorer.js > log');
