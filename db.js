// Requires
var util = require("./util.js");

// DB Connection
exports.connection = null;

// Init DB
exports.init = function(host, user, pass, name) {
	var callback = this;
	function kickWatchDog() {
		try { this.connection.end(); } catch(e) {}
		setTimeout(function () { require('./db.js').init(); }, 5000);
	}
	util.log(("DB INIT, Starting DB...").cyan);
	var mysql = require('mysql');
	this.connection = mysql.createConnection({
		host     : host,
		user     : 'userdev',
		port     : 3306,
		password : pass,
		database : name
	});
	this.connection.on('error', function(err) {
		util.log("DB ERROR, Disconected DB!");
		util.log("DB ERROR, " + err);
		kickWatchDog();
	});
	this.connection.connect(function(err) {
		if (err) {
			util.log("DB ERROR, Disconected DB!");
			util.log("DB ERROR, " + err);
			kickWatchDog();
		} else {
			util.log(("DB INIT, DB Started OK").cyan);
		}
	});
}

// Prepares a SQL Insert from an associative array
exports.prepareInsert = function(data, table) {
	var values = [], keys = [];
	for (var key in data) {
		if (data[key] == null) values.push("NULL");
		else if (key == "createdAt" || key == "modifiedAt") values.push(data[key]);
		else values.push("'"+data[key]+"'");
		keys.push(key);
	}
	var sqlString = "INSERT INTO "+ table +" (" + keys.join(',') + ") VALUES(" + values.join(',') + ")";
	return sqlString;
}
