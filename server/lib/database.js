var mysql = require('mysql'),
	os = require('os'),
	connection;
	
var pool = mysql.createPool({
		host: 'p3plcpnl0172.prod.phx3.secureserver.net',
		//host: 'localhost',
		user: 'administrator',
		password: 'Password01',
		database: 'w3bbi',
		multipleStatements: true,
		dateStrings: true,
		timezone: 'utc'
	});

module.exports = {
	connect: database_connect,
	
	//grab a connection from the pool, then run SQL query
	query: function(custom_query, callback, post){
		pool.getConnection(function(err, con){
			con.query(custom_query, post, function(err, result){
				con.release();
				callback(result, err);
			});
		});
	}
};

//connects to the mysql database
function database_connect() {
	//create connection object from pool
	pool.getConnection(function(err, con) {
		if (err){
			console.log(err);
			console.log("MYSQL pool connection error!");
			setTimeout(database_connect, 2000);
		}
		else {
			console.log("Successfully connected to MYSQL database!");
			connection = con;
		}
	});
	
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
}