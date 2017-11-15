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
    mailer.sendMail(mailOptions, cb);
  },

  //helper function to email someone with a EJS template
  sendEJSMail : function(pathEJSTemplate, EJSVariables, emailDetails, cb){
    console.log("F: Sending EJS email...");

    //read the file and add appropriate variables
    ejs.renderFile(pathEJSTemplate, EJSVariables, null, function(err, html_str){
      if (err){
        console.log(err);
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
            console.log(err);
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
