console.log("Connecting to database...");

var mysql = require('mysql');
var pool = mysql.createPool({
  host: 'p3plcpnl0172.prod.phx3.secureserver.net',
  //host: 'localhost',
  user: 'administrator',
  password: 'Password01',
  database: 'domahub',
  multipleStatements: true,
  dateStrings: true,
  timezone: '+0:00',
  charset: "utf8_unicode_ci"
});

module.exports = {
  //grab a connection from the pool, then run SQL query
  query: function(custom_query, error_description, callback, post){
    pool.getConnection(function(err, con){

      //something went wrong with the mysql query!
      if (!err){
        con.query(custom_query, post, function(err, result){
          con.release();
          callback({
            state : "success",
            info : result
          });
        });
      }
      else {
        console.log(err);
        callback({
          state : "error",
          info : error_description,
          errcode : err.code
        });
      }
    });
  }
};
