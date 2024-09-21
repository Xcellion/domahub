//#region -------------------------------DOMA LIB FUNCTIONS-------------------------------

var crypto = require("crypto");
var encryption_algorithm = "aes-256-ctr";
var encryption_password = "domahubruleswoohoo_registrar";

//#endregion

module.exports = {

  //#region -------------------------------ENCRYPTION FUNCTIONS-------------------------------

  encryptText : function(text){
    var cipher = crypto.createCipher(encryption_algorithm, encryption_password)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return crypted;
  },

  decryptText : function(text){
    var decipher = crypto.createDecipher(encryption_algorithm, encryption_password)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    return dec;
  }

  //#endregion

}
