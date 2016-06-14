var mysql 	= require('mysql'),
	os 		= require('os'),
	connection;

module.exports = {
	connect: database_connect,
	
	//post is used to escape the SQL query
	query: function(custom_query, callback, post){
		connection.query(custom_query, post, function(err, result){
			if (err) throw err;
			callback(result, err);
		});
	},
	
	//escape user input parameters
	escape: function(data){
		return connection.escape(data);
	},
	
	//closes the current connection and creates a new one
	end: function(){
		connection.end(function(err){
			if (err) throw err;
		});
		database_connect();
	}
};

//connects to the mysql database, multibool is a boolean to set whether or not multi-statement MYSQL queries are allowed
function database_connect(multibool) {
	//create connection object
	connection = mysql.createConnection({
		host: 'p3plcpnl0172.prod.phx3.secureserver.net',
		//host: 'localhost',
		user: 'administrator',
		password: 'Password01',
		database: 'w3bbi',
		multipleStatements: multibool,
		dateStrings: true,
		timezone: 'utc'
	});
	
	connection.connect(function(err) {
		if (err) {
			console.log(err);
			console.log("MYSQL connection error!");
			setTimeout(database_connect, 2000);
		}
		else {
			console.log("Successful connection!");
		}
	});
	
	//reconnect if errored
	connection.on('error', function(err) {
		if (err.code === 'PROTOCOL_CONNECTION_LOST') {
			console.log("Reconnecting to MYSQL...");
			database_connect();
		}
		else if (err.code === 'ECONNRESET') {
			console.log("Reconnecting to MYSQL...");
			database_connect();
		}
		else {
			throw err;
		}
	});
}