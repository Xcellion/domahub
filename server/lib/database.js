var mysql = require('mysql'),
	os = require('os');

var pool = mysql.createPool({
		host: 'p3plcpnl0172.prod.phx3.secureserver.net',
		//host: 'localhost',
		user: 'administrator',
		password: 'Password01',
		database: 'w3bbi',
		multipleStatements: true,
		dateStrings: true,
		timezone: '+0:00',
		charset: "utf8_unicode_ci"
	});

module.exports = {
	connect: database_connect,

	//grab a connection from the pool, then run SQL query
	query: function(custom_query, callback, post){
		pool.getConnection(function(err, con){
			if (!err){
				con.query(custom_query, post, function(err, result){
					con.release();
					callback(result, err);
				});
			}
			else {
				callback(false, err);
			}
		});
	}
};

//connects to the mysql database
function database_connect() {
	//reconnect if errored
	pool.on('error', function(err) {
		if (err.code === 'PROTOCOL_CONNECTION_LOST') {
			console.log("Reconnecting to MYSQL...");
			database_connect();
		}
		else if (err.code === 'ECONNRESET') {
			setTimeout(database_connect, 2000);
		}
		else {
			throw err;
		}
	});

	//timezone
	pool.on('connection', function onConnection(connection) {
		console.log("Setting MYSQL timezone to UTC");
		connection.query('SET time_zone = ?', '+0:00');
	});
}
