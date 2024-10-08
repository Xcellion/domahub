//#region -------------------------------DOMA LIB FUNCTIONS-------------------------------

var error = require('../lib/error.js');

//#endregion

//#region -------------------------------VARIABLES-------------------------------

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json({limit: '500mb'});
var urlencodedParser = bodyParser.urlencoded({
  extended: true,
  limit: '500mb',
  parameterLimit:500000
});

//#endregion

module.exports = {

  urlencodedParser : urlencodedParser,
  jsonParser : jsonParser,

  //send json success
  sendSuccess : function(req, res, next){
    console.log("GF: Sending success...");
    res.send({
      state: "success"
    });
  },

  //send json success and go next
  sendSuccessNext : function(req, res, next){
    console.log("GF: Sending success and then going next...");
    res.send({
      state: "success"
    });

    next();
  },

  //send json error
  sendError : function(req, res, next){
    console.log("GF: Sending error...");
    res.send({
      state: "error"
    });
  },

  //check dev or not
  ifNotDev : function(req, res, next){
    console.log("GF: Checking if development...");
    if (process.env.NODE_ENV != "dev"){
      next();
    }
    else {
      res.sendStatus(200);
    }
  }

}
