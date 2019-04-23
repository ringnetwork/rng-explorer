var db = require('rng-core/db/db.js');
var conf = require('../conf.js');
var constants = require('rng-core/config/constants.js');
var create_deposit_address = require("rng-core/sc/deposit.js");
var supernode = require('rng-core/wallet/supernode');
var round = require('rng-core/pow/round');
var validationUtils = require('rng-core/validation/validation_utils')

var wallet_id;
var my_address;

/**
 * read single wallet
 * @param {function} handleWallet - handleWallet(wallet)
 */
function readSingleWallet(handleWallet){
	db.query("SELECT wallet FROM wallets", function(rows){
		if (rows.length === 0)
			throw Error("no wallets");
		if (rows.length > 1)
			throw Error("more than 1 wallet");
		handleWallet(rows[0].wallet);
	});
}

/**
 * read single address
 * @param {function} handleAddress - handleAddress(address)
 */
function readSingleAddress(handleAddress){
	db.query("SELECT address FROM my_addresses WHERE wallet=?", [wallet_id], function(rows){
		if (rows.length === 0)
			throw Error("no addresses");
		if (rows.length > 1)
			throw Error("more than 1 address");
		handleAddress(rows[0].address);
	});
}


/**
 * RPC APIs
 */
function initRPC() {
  var rpc = require('json-rpc2');
  var db = require('rng-core/db/db.js');
	var walletDefinedByKeys = require('rng-core/wallet/wallet_defined_by_keys.js');
	var Wallet = require('rng-core/wallet/wallet.js');
	var balances = require('rng-core/wallet/balances.js');
	var mutex = require('rng-core/base/mutex.js');
	var storage = require('rng-core/db/storage.js');
	var depositReward = require('rng-core/sc/deposit_reward.js');

	var server = rpc.Server.$create({
		'websocket': true, // is true by default
		'headers': { // allow custom headers is empty by default
			'Access-Control-Allow-Origin': '*'
		}
	});

	/**
	 * Returns information about the current state.
	 * @return { last_mci: {Integer}, last_stable_mci: {Integer}, count_unhandled: {Integer} }
	 */
	server.expose('getInfo', function(args, opt, cb) {
		var response = {};
		storage.readLastMainChainIndex(function(last_mci){
			response.last_mci = last_mci;
			storage.readLastStableMcIndex(db, function(last_stable_mci){
				response.last_stable_mci = last_stable_mci;
				db.query("SELECT COUNT(*) AS count_unhandled FROM unhandled_joints", function(rows){
					response.count_unhandled = rows[0].count_unhandled;
					cb(null, response);
				});
			});
		});
	});

	server.expose('getTotalRewardByPeriod', function(args, opt, cb){
		var rewardPeriod = args[0];
		if( isNaN(rewardPeriod) || rewardPeriod <= 0 || !validationUtils.isPositiveInteger(rewardPeriod)) {
			return cb("rewardPeriod must be a number and more than 0")
		}
		depositReward.getTotalRewardByPeriod(db, parseInt(rewardPeriod), function(err, totalReward){
			if(err){
				return cb(err)
			}
			cb(null, totalReward);
		});	
	});

	server.expose('getCoinRewardRatio', function(args, opt, cb){
		var rewardPeriod = args[0];
		if( isNaN(rewardPeriod) || rewardPeriod <= 0 || !validationUtils.isPositiveInteger(rewardPeriod)) {
			return cb("rewardPeriod must be a number and more than 0")
		}
		depositReward.getCoinRewardRatio(db, parseInt(rewardPeriod), function(err, coinRewardRatio){
			if(err){
				return cb(err)
			}
			cb(null, coinRewardRatio);
		});	
	});

	readSingleWallet(function(_wallet_id) {
		wallet_id = _wallet_id;
		readSingleAddress(function(_my_address){
			my_address = _my_address;
			// listen creates an HTTP server on localhost only
			server.listen(conf.rpcRewardPort, conf.rpcInterface);
		})
	});
}

exports.initRPC = initRPC;
