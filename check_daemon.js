/*jslint node: true */
"use strict";
var check_daemon = require('rng-core/base/check_daemon.js');

check_daemon.checkDaemonAndRestart('node explorer.js', 'node explorer.js > log');
