console.log("Connecting to database...");

//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var error = require('./error.js');

//</editor-fold>

//<editor-fold>-------------------------------VARIABLES-------------------------------

var mysql = require('mysql');
var mysql_options = {
  port: 3306,
  host: "127.0.0.1",
  user: 'domadministrator',
  password: 'k#h8$.Kg.TWQ',
  database: 'domahub',
  multipleStatements: true,
  dateStrings: true,
  timezone: '+0:00',
  charset: "utf8_unicode_ci",
  connectionLimit: 100
}

//</editor-fold>

//scp -r wonmin@208.68.37.82:/home/wonmin/.pm2/logs/DomaHub-Server--Prod--out-0.log lol.txt

//<editor-fold>-------------------------------PROD INSTRUCTIONS ON MYSQL SETUP-------------------------------

////////////////////////////////////////////////////////OPEN UFW PORT
//will revert on iptables on reboot (remain on ufw)
//sudo ufw allow in on eth0 to any port 3306

////////////////////////////////////////////////////////REMOVE LEFTOVER UFW RULES ( BE CAREFUL NOT TO DELETE WRONG RULES )
//sudo ufw status
//sudo ufw delete 4
//sudo ufw delete 7
//sudo service ufw restart

////////////////////////////////////////////////////////ACCESS TO PHPMY ADMIN ON PRODUCTION SERVER
//find and uncomment out (using a # at the front) include sites-enabled/mysql
//restart openresty

//sudo nano /usr/local/openresty/nginx/conf/sites-enabled/default
//CTRL + SHIFT + _
//line 41
//sudo openresty -s reload

// if (process.env.NODE_ENV == "dev"){
//   mysql_options.host = "domahub.com";
// }

////////////////////////////////////////////////////////ACCESS TO PHPMY ADMIN ON PRODUCTION SERVER
//mysqldump -u root -p domahub > domahub.SQL
//enter password from keepbase database (MYSQL root)
//scp -r wonmin@208.68.37.82:/home/wonmin/domahub.sql other/Technical/MySQL\ Backups/domahub.sql

//</editor-fold>

var pool = mysql.createPool(mysql_options);

module.exports = {

  //<editor-fold>-------------------------------FUNCTIONS-------------------------------

  //grab a connection from the pool, then run SQL query
  query: function(custom_query, error_description, callback, post){
    pool.getConnection(function(err, con){

      if (!err){
        con.query(custom_query, post, function(err, result, fields){
          con.release();
          if (err){
            error.log(err, custom_query + JSON.stringify(post));
            callback({
              state : "error",
              info : error_description
            });
          }
          else {
            callback({
              state : "success",
              info : result
            });
          }
        });
      }
      //something went wrong with the mysql query!
      else {
        error.log(err, custom_query + JSON.stringify(post));
        callback({
          state : "error",
          info : error_description
        });
      }
    });
  }

  //</editor-fold>

};
