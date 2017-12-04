//<editor-fold>-------------------------------VARIABLES-------------------------------

var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var mailer = nodemailer.createTransport(sgTransport({
  auth: {
    api_key: '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'
  }
}));

var ejs = require('ejs');
var path = require("path");

//</editor-fold>

module.exports = {

  //send basic email
  sendBasicMail : function(mailOptions, cb){
    console.log("F: Sending basic email...");
    mailer.sendMail(mailOptions, function(err){
      if (err){
        error.log(err, "Failed to send basic email.");
      }
      if (cb){
        cb();
      }
    });
  },

  //helper function to email someone with a EJS template
  sendEJSMail : function(pathEJSTemplate, EJSVariables, emailDetails, cb){
    console.log("F: Sending EJS email...");

    //read the file and add appropriate variables
    ejs.renderFile(pathEJSTemplate, EJSVariables, null, function(err, html_str){
      if (err){
        error.log(err, "Failed to render EJS template for HTML email.");
        if (cb){
          cb("error");
        }
      }
      else {
        //set EJS template to body of email
        emailDetails.html = html_str;

        //send email
        mailer.sendMail(emailDetails, function(err) {
          if (err){
            error.log(err, "Failed to send HTML email.");
            if (cb){
              cb("error");
            }
          }
          else if (cb){
            cb("success");
          }
        });
      }
    });
  }

};

//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var error = require("./error.js");

//</editor-fold>
