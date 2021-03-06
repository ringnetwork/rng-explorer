/*jslint node: true */
"use strict";

/**
 *	for version control
 */
exports.clientName		= 'rng-explorer';
exports.minClientVersion	= '1.1.0';


exports.WS_PROTOCOL = 'ws://';
// https://console.developers.google.com
exports.pushApiProjectNumber = 0;
exports.pushApiKey = '';

exports.webPort = 8000;

exports.port = 9195;
exports.myUrl = 'ws://127.0.0.1:9195';
exports.bServeAsHub = true;
exports.bSaveJointJson = true;
exports.bLight = false;
exports.bServeAsRpc = true;
exports.rpcInterface = '127.0.0.1';
exports.rpcPort = 6553;
exports.debug = false;

// deposit reward
exports.bCalculateReward = true;
exports.bServeAsRewardRpc = true;
exports.rpcRewardPort = 6883;

// byzantine
exports.IF_BYZANTINE = false;

// this is used by wallet vendor only, to redirect bug reports to developers' email
exports.bug_sink_email = 'admin@example.org';
exports.bugs_from_email = 'bugs@example.org';

exports.HEARTBEAT_TIMEOUT = 300*1000;

exports.initial_peers = [
    "ws://explorer-beta2.ringnetwork.org:9195",
];

exports.storage = 'sqlite';

exports.deviceName = 'Supernode';
exports.permanent_pairing_secret = 'randomstring';
exports.safe_address = null;
exports.coinbase_address = null;

exports.bSingleAddress = true;
exports.THRESHOLD_DISTANCE = 6;
exports.MIN_AVAILABLE_WITNESSINGS = 100;
exports.bPostTimestamp = false;

exports.start_mining_round = 0;
exports.maxWorkderCount = 0;

exports.KEYS_FILENAME = 'keys.json';

console.log('finished witness conf');
