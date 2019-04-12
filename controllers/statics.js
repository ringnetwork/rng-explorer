/*jslint node: true */
'use strict';

var db = require('rng-core/db/db.js');
var storage = require('rng-core/db/storage.js');
var round = require('rng-core/pow/round.js');
var gossiper = require('rng-core/p2p/gossiper.js');
var moment = require('moment');
var async = require('async');
var staticdata = {};

var MAX_ROUND_IN_CACHE = 10;

var activeAddress;
var allAddress;
var level;
var allUnits;
var allUserUnits;

// recent 24 hours
var totalUnits;
var totalUserUnits;
var totalFees;
var date;
//
var assocCachedStatistics = {};

function updateStatistics(){


	// user transaction
	db.query("SELECT \n\
        COUNT( DISTINCT units.unit ) as count \n\
	FROM \n\
        units \n\
        LEFT JOIN unit_authors ON units.unit = unit_authors.unit \n\
	WHERE \n\
        unit_authors.address NOT IN ( '2SATGZDFDXNNJRVZ52O4J6VYTTMO2EZR', '33RVJX3WBNZXJOSFCU6KK7O7TVEXLXGR', 'FYQXBPQWBPXWMJGCHWJ52AK2QMEOICR5', 'J3XIKRBU4BV2PX2BP4PSGIXDVND2XRIF', 'K5JWBZBADITKZAZDTHAPCU5FLYVSM752', 'KM5FZPIP264YRRWRQPXF7F7Y6ETDEW5Y', 'NBEFJ3LKG2SBSBK7D7GCFREOAFMS7QTQ', 'RIHZR7AHPVKZWTTDWI6UTKC7L73BJJQW', 'TIPXQ4CAO7G4C4P2P4PEN2KQK4MY73WD', 'X27CW2UWU5SGE647LK5SBTIPOOIQ7GJT', 'X6DWZUEW4IBFR77I46CAKTJVK4DBPOHE', 'XIM76DRNUNFWPXPI5AGOCYNMA3IOXL7V' ) AND units.creation_date>"+db.addTime("-24 HOUR"), function(rows) {
		totalUserUnits = rows[0].count;
	});

	// all transaction
	db.query("SELECT \n\
        COUNT( DISTINCT units.unit ) as count  \n\
	FROM \n\
        units \n\
        LEFT JOIN unit_authors ON units.unit = unit_authors.unit \n\
	WHERE \n\
        units.creation_date>"+db.addTime("-24 HOUR"), function(rows) {
		totalUnits = rows[0].count;
	});

	// max_level
	db.query("SELECT MAX(level)  as level from units", function(rows) {
		level = rows[0].level;
	});

	//all address
	db.query("SELECT COUNT( DISTINCT address ) as count FROM outputs", function(rows) {
		allAddress = rows[0].count;
	});

	// active address
	db.query("SELECT COUNT( DISTINCT address ) as count FROM outputs WHERE is_spent =0", function(rows) {
		//console.log(rows);
		activeAddress = rows[0].count;

	});

	// recent  fees
	db.query("SELECT SUM(headers_commission+payload_commission) as fee from units LEFT JOIN unit_authors ON units.unit = unit_authors.unit WHERE \n\
	unit_authors.address NOT IN ( '2SATGZDFDXNNJRVZ52O4J6VYTTMO2EZR', '33RVJX3WBNZXJOSFCU6KK7O7TVEXLXGR', 'FYQXBPQWBPXWMJGCHWJ52AK2QMEOICR5', 'J3XIKRBU4BV2PX2BP4PSGIXDVND2XRIF', 'K5JWBZBADITKZAZDTHAPCU5FLYVSM752', 'KM5FZPIP264YRRWRQPXF7F7Y6ETDEW5Y', 'NBEFJ3LKG2SBSBK7D7GCFREOAFMS7QTQ', 'RIHZR7AHPVKZWTTDWI6UTKC7L73BJJQW', 'TIPXQ4CAO7G4C4P2P4PEN2KQK4MY73WD', 'X27CW2UWU5SGE647LK5SBTIPOOIQ7GJT', 'X6DWZUEW4IBFR77I46CAKTJVK4DBPOHE', 'XIM76DRNUNFWPXPI5AGOCYNMA3IOXL7V' ) \n\
		AND units.creation_date>"+db.addTime("-24 HOUR"), function(rows) {
		// console.log(rows);
		totalFees = rows[0].fee;
	});


	// all units
	db.query("SELECT COUNT( * ) as count FROM units", function(rows) {
		//console.log(rows);
		allUnits = rows[0].count;

	});

	// all user units
	db.query("SELECT COUNT( * ) as count FROM units LEFT JOIN unit_authors ON units.unit = unit_authors.unit  WHERE \n\
        unit_authors.address NOT IN ( '2SATGZDFDXNNJRVZ52O4J6VYTTMO2EZR', '33RVJX3WBNZXJOSFCU6KK7O7TVEXLXGR', 'FYQXBPQWBPXWMJGCHWJ52AK2QMEOICR5', 'J3XIKRBU4BV2PX2BP4PSGIXDVND2XRIF', 'K5JWBZBADITKZAZDTHAPCU5FLYVSM752', 'KM5FZPIP264YRRWRQPXF7F7Y6ETDEW5Y', 'NBEFJ3LKG2SBSBK7D7GCFREOAFMS7QTQ', 'RIHZR7AHPVKZWTTDWI6UTKC7L73BJJQW', 'TIPXQ4CAO7G4C4P2P4PEN2KQK4MY73WD', 'X27CW2UWU5SGE647LK5SBTIPOOIQ7GJT', 'X6DWZUEW4IBFR77I46CAKTJVK4DBPOHE', 'XIM76DRNUNFWPXPI5AGOCYNMA3IOXL7V' ) ", function(rows) {
		//console.log(rows);
		allUserUnits = rows[0].count;

	});



	date = moment(Date.now()).format();
}




function getStatistics(){
	var data={};
	data['activeAddress'] = activeAddress;
	data['allAddress'] = allAddress;
	data['level'] = level;
	data['totalUnits'] = totalUnits;
	data['totalUserUnits'] = totalUserUnits;
	data['totalFees'] = totalFees;
	data['date'] = date;
	data['allUnits'] = allUnits;
	data['totalUsersUnits'] = allUserUnits;

	

	return data;
}

function getRoundStatus(round_index,callback){
	if (round_index == -1){
		db.query("SELECT max(round_index) as curRound from round", function(rows) {
			round_index = rows[0].curRound ;
			getRoundStatusByRoundIndex(round_index, callback);
	})}
	else{
		getRoundStatusByRoundIndex(round_index, callback);
	}

}

function getOnlinePeers(){
	var network = require('rng-core/p2p/network.js');
	return network.getOnLinePeers();
}

function getRoundStatusByRoundIndex(round_index,callback){
	var data = {};
	// var peerList = gossiper.getLivePeerUrls();
	// console.log("Statistics peerList live:" + JSON.stringify(peerList));
	// var peerList1 = gossiper.getAllPeerUrls();
	// console.log("Statistics peerList all:" + JSON.stringify(peerList1));
	db.query("SELECT pow_type, address \n\
		FROM units join unit_authors USING(unit) \n\
		WHERE round_index =? and pow_type IS NOT NULL ORDER BY pow_type,main_chain_index,unit ", [round_index], function(rows) {
			var arrPowunits = rows.filter(function (unit){
				return unit.pow_type == 1 ;
			});
			var arrTrustMEunits = rows.filter(function (unit){
				return unit.pow_type == 2 ;
			});
			var arrCoinbaseunits = rows.filter(function (unit){
				return unit.pow_type == 3 ;
			});

			data['roundIndex'] = round_index;
			data['countofPOWUnit'] = arrPowunits.length;
			data['arrPowUnits'] = arrPowunits;
			data['countofTrustMEUnit'] = arrTrustMEunits.length;
			data['countofCoinbaseUnit'] = arrCoinbaseunits.length;
	
			if (assocCachedStatistics[round_index]){
				data['difficultyOfRound'] = assocCachedStatistics[round_index].difficultyOfRound;
				data['totalMine'] = assocCachedStatistics[round_index].totalMine;
				data['totalPublishCoin'] = assocCachedStatistics[round_index].totalPublishCoin;
				data['depositRatio'] = assocCachedStatistics[round_index].depositRatio;
				data['inflationRatio'] = assocCachedStatistics[round_index].inflationRatio*100;
				return callback(data);
			}
			round.getDifficultydByRoundIndex(db, round_index, function (difficultyOfRound){
				round.getStatisticsByRoundIndex(db, round_index-1, function (err, totalMine, totalPublishCoin, depositRatio, inflationRatio){
					if(err)
						return callback(data);
					data['difficultyOfRound'] = difficultyOfRound;	
					data['totalMine'] = totalMine;
					data['totalPublishCoin'] = totalPublishCoin;
					data['depositRatio'] = depositRatio;
					data['inflationRatio'] = inflationRatio*100;
					assocCachedStatistics[round_index] = {"difficultyOfRound": difficultyOfRound,
														  "totalMine": totalMine,
														  "totalPublishCoin": totalPublishCoin,
														  "depositRatio": depositRatio,
														  "inflationRatio": inflationRatio};
					console.log("Statistics round_index:" + round_index + ", data:" + JSON.stringify(data));														
					callback(data);
				});
			});
		});

}


// cache begin
function shrinkRoundCacheObj(roundIndex, arrIndex, assocCachedObj){
    console.log("shrink Round Cache , begin roundIndex:" + roundIndex);
    var minIndex = Math.min.apply(Math, arrIndex);
    if(roundIndex - minIndex > 10000){
        console.log("shrink Round Cache, remove all");
        assocCachedObj = {};
    }
    else{
        for (var offset = minIndex; offset < roundIndex - MAX_ROUND_IN_CACHE; offset++){
            console.log("shrink Round Cache, remove roundIndex:" + offset);
            delete assocCachedObj[offset];
        }
    }
}
function shrinkRoundCache(){
    var arrStatistics = Object.keys(assocCachedStatistics);
	if (arrStatistics.length < MAX_ROUND_IN_CACHE){
        return console.log('round Statistics cache is small, will not shrink');
    }
	round.getCurrentRoundIndex(db, function(roundIndex){
        shrinkRoundCacheObj(roundIndex, arrStatistics, assocCachedStatistics);          
	});
}

setInterval(shrinkRoundCache, 1000*1000);

// cache end


exports.getStatistics = getStatistics;
exports.getRoundStatus = getRoundStatus;
exports.getOnlinePeers = getOnlinePeers;

setTimeout(updateStatistics,1000*5);
setInterval(updateStatistics,10*60*1000);



