//#region -------------------------------VARIABLES-------------------------------

var nodemailer = require("nodemailer");
var sgTransport = require("nodemailer-sendgrid-transport");
var mailer = nodemailer.createTransport(
  sgTransport({
    auth: {
      api_key: "",
    },
  })
);

var ejs = require("ejs");
var path = require("path");

//#endregion

module.exports = {
  //send basic email
  sendBasicMail: function (mailOptions, cb) {
    console.log("F: Sending basic email...");
    // mailer.sendMail(mailOptions, function(err){
    //   if (err){
    //     error.log(err, "Failed to send basic email.");
    //     if (cb){
    //       cb(false);
    //     }
    //   }
    //   if (cb){
    //     cb(true);
    //   }
    // });
  },

  //helper function to email someone with a EJS template
  sendEJSMail: function (pathEJSTemplate, EJSVariables, emailDetails, cb) {
    console.log("F: Sending EJS email...");

    //read the file and add appropriate variables
    ejs.renderFile(
      pathEJSTemplate,
      EJSVariables,
      null,
      function (err, html_str) {
        if (err) {
          error.log(err, "Failed to render EJS template for HTML email.");
          if (cb) {
            cb("error");
          }
        } else {
          //set EJS template to body of email
          emailDetails.html = html_str;

          //send email
          // mailer.sendMail(emailDetails, function (err) {
          //   if (err) {
          //     error.log(err, "Failed to send HTML email.");
          //     if (cb) {
          //       cb("error");
          //     }
          //   } else if (cb) {
          //     cb("success");
          //   }
          // });
        }
      }
    );
  },
};

//#region -------------------------------DOMA LIB FUNCTIONS-------------------------------

var error = require("./error.js");

//#endregion
