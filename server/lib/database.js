console.log("Connecting to database...");

var mysql = require('mysql');
var mysql_options = {
  host: "localhost",
  user: 'domadministrator',
  password: 'k#h8$.Kg.TWQ',
  database: 'domahub',
  multipleStatements: true,
  dateStrings: true,
  timezone: '+0:00',
  charset: "utf8_unicode_ci"
}

//uncomment to use production database, but needs to open ports on serverHTTP

//command to open port
//will revert on iptables on reboot (remain on ufw)
//sudo ufw allow in on eth0 to any port 3306

//remove leftover ufw rules
//sudo ufw status
//sudo ufw delete RULE_NUM

//access to phpmyadmin (prod)
//sudo nano /usr/local/openresty/nginx/conf/sites-enabled/default
//find and uncomment out (using a # at the front) include sites-enabled/mysql
//restart openresty with sudo openresty -s reload

if (process.env.NODE_ENV == "dev"){
  mysql_options.host = "domahub.com";
}

var pool = mysql.createPool(mysql_options);

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
