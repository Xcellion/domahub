//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var error = require('../lib/error.js');

//</editor-fold>

//<editor-fold>-------------------------------VARIABLES-------------------------------

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: true });

//</editor-fold>

module.exports = {

  urlencodedParser : urlencodedParser,

  //send json success
  sendSuccess : function(req, res, next){
    res.send({
      state: "success"
    });
  },

  //send json success and go next
  sendSuccessNext : function(req, res, next){
    res.send({
      state: "success"
    });

    next();
  },

  //send json error
  sendError : function(req, res, next){
    res.send({
      state: "error"
    });
  },

  //function to check dev or not
  ifNotDev : function(req, res, next){
    if (process.env.NODE_ENV != "dev"){
      next();
    }
    else {
      res.sendStatus(200);
    }
  }

}
