
// Requires
var util = require("./util.js");
var protocol = require("./protocol.js");

// Send Ack
exports.sendAck = function(MsgNum, deviceId, rinfo, server) {
	var dgram = require('dgram');   
	var strMessage = ">ACK;#" + MsgNum + ";ID=" + deviceId + ";*";
	strMessage = strMessage + protocol.calculateChecksum(strMessage) + "<";
	var message = new Buffer.from(strMessage);
	var client = dgram.createSocket("udp4");
	server.send(message, 0, message.length, rinfo.port, rinfo.address, function(err, bytes) {
		if (!err) {
			util.log((rinfo.address + ":" + rinfo.port + " <- " + message).cyan);  
		}
		client.close();
	});
}

// Send Message
exports.sendMessage = function (message, ip, port, server) {
	var dgram = require('dgram');   
	var message = new Buffer.from(message);   
	var client = dgram.createSocket("udp4");
	server.send(message, 0, message.length, port, ip, function(err, bytes) {
		if (!err) {
			util.log((ip + ":" + port + " <- " + message).cyan);  
		}
		client.close();
	});
}
