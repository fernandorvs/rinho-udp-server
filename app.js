// Server & Requires
var cfg = require('./config.js');
var dgram = require("dgram");
var server = dgram.createSocket("udp4");
var util = require("./util.js");
var protocol = require("./protocol.js");
var network = require("./network.js");
var database = require("./db.js");
var colors = require("colors");

// Devices
// ___

var listDevice = {};

function updateDeviceList(data, rinfo) {
	if (listDevice[data.deviceId] === undefined) {
		listDevice[data.deviceId] = {
			'deviceId': data.deviceId,
			address: rinfo.address, port: rinfo.port, rinfo: rinfo,
			tick: (new Date()).getTime(), commands: [], globalMsgNum: 0xFFFF
		};
	} else {
		listDevice[data.deviceId].address = rinfo.address;
		listDevice[data.deviceId].port = rinfo.port;
		listDevice[data.deviceId].tick = (new Date()).getTime();
		listDevice[data.deviceId].winSize = 10;
	}
}

function deviceExpire(deviceId) {
	try {
		util.log(("Device: " + deviceId + " expired").yellow);
		delete listDevice[deviceId];
	} catch (e) {
		console.log(e);
	}
}


// UDP Server
// ___

server.on("error", function (err) {
	util.log((colors.red + "UDP Server ERROR" + err.stack).red);
	server.close();
});


server.on("listening", function () {
	var address = server.address();
	util.log(("UDP Server INIT, listening on: " + address.address + ":" + address.port).cyan);
});

function mysqlInserts(data) {

}

server.on("message", function (msg, rinfo) {
	util.log((rinfo.address + ":" + rinfo.port + " -> " + msg).green);
	protocol.parserMessage(msg).forEach(function (packet) {
		var msgNum = packet['msgNum'], deviceId = packet['deviceId'];
		updateDeviceList(packet, rinfo);
		var cqs = protocol.parserCQ(packet['sourcePacket']);
		var ers = protocol.parserER(packet['sourcePacket']);
		var reports = cqs.concat(ers);
		reports.forEach(function (data) {
			var sqlString = database.prepareInsert(data, "tracks");
			database.connection.query(sqlString, function (err, rows, fields) {
				if (err) util.log(("ERROR DB, " + err['code']).red); else {
					if (msgNum && deviceId) {
						network.sendAck(msgNum, deviceId, rinfo, server);
					}
				}
			});
		});
		var msgNumDec = parseInt(msgNum, 16);
		if (reports.length == 0 && (msgNum && deviceId && msgNumDec < 0x8000)) {
			network.sendAck(msgNum, deviceId, rinfo, server);
		}
		if (msgNumDec >= 0x8000) {
			var device = listDevice[deviceId];
			device.commands.forEach(function (command) {
				for (var i = 0; i < device.commands.length; i++) {
					if (device.commands[i].msgNum == msgNumDec) {
						var sqlString = "update actions set status = 0, modifiedAt = now(), response = '" + packet.body + "', ref = '" + packet.msgNum + "' where id = '" + device.commands[i].id + "' limit 1";
						device.commands.splice(i, 1);
						if (device.commands == undefined) device.commands = [];
						if (device.semaforo != null) device.semaforo = 0;
						device.semaforo = 1;
						database.connection.query(sqlString, function (err, rows, fields) {
							if (err) console.log(err);
							device.semaforo = 0;
						});
					}
				}
			});
		}
	});
});

// Commands
// ___

var globalMsgNum = 0xFFFF;

// Load devices commands from Mysql to Ram
setInterval(function () {
	var nowTick = (new Date()).getTime();
	for (var key in listDevice) {
		var deviceId = listDevice[key].deviceId;
		if (listDevice[key].commands.length < listDevice[key].winSize) {
			var sqlString = "SELECT * FROM actions WHERE deviceId = '"
				+ deviceId
				+ "' AND STATUS = 1 AND reference = (SELECT DISTINCT reference FROM actions WHERE STATUS = 1 AND deviceId = '"
				+ deviceId
				+ "' ORDER BY reference ASC LIMIT 1) ORDER BY id ASC LIMIT "
				+ (listDevice[key].winSize);
			database.connection.query(sqlString, function (err, rows, fields) {
				if (err) {
					console.log(("ERROR DB, " + err['code']).red);
				} else {
					if (rows.length) {
						rows.forEach(function (row) {
							try {
								if (listDevice[row.deviceId].commands.length < listDevice[key].winSize) {
									var agrega = 1;
									listDevice[row.deviceId].commands.forEach(function (comando) {
										if (comando.id == row.id) agrega = 0;
									});
									if (agrega == 1) listDevice[row.deviceId].commands.push(row);
								}
							} catch (e) {
								console.log(e);
							}
						});
					}
				}
			});
		}
		if (nowTick >= (listDevice[key].tick + cfg.parms.deviceTimeToLive * 1000)) {
			deviceExpire(deviceId);
		}
	}
}, 1000);

// Message Download Service
setInterval(function () {
	for (var key in listDevice) {
		if (listDevice[key].commands.length > 0) {
			var device = listDevice[key];
			var comandos = device.commands;
			for (var com in comandos) {
				var command = device.commands[com];
				if (command.msgNum == null || command.msgNum == undefined) {
					device.globalMsgNum = !(device.globalMsgNum >= 0x8000 && device.globalMsgNum < 0xFFFF) ? 0x8000 : device.globalMsgNum + 1;
					command.msgNum = device.globalMsgNum;
					command.timeout = 0;
				}
				if (!command.timeout--) {
					command.timeout = retryTime * 10;
					var commandStr = ">" + command.cmd + ";#" + command.msgNum.toString(16).toUpperCase();
					commandStr += ";ID=" + device.deviceId + ";*";
					commandStr += protocol.calculateChecksum(commandStr) + "<";
					network.sendMessage(commandStr, device.address, device.port, server);
				}
			}
		}
	}
}, 100);

// WebServer
// ___

function webServerInit() {
	// const express = require('express');
	// const app = express();
	// const port = 3000;

	// app.get('/', (req, res) => {
	// 	res.send('Hello World!')
	// })

	// app.listen(port, () => {
	// 	util.log((`WebServer Listening on port ${port}`).yellow);
	// })
}

// Main
// ___

function main() {
	database.init(cfg.parms.mySqlHost, cfg.parms.mySqlUser, cfg.parms.mySqlPass, cfg.parms.mySqlName);
	server.bind(cfg.parms.listeningPort);
	webServerInit();
}

main();