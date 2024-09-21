//#region -------------------------------DOMA LIB FUNCTIONS-------------------------------

var auth_functions = require('./auth_functions.js');

var error = require('../lib/error.js');
var mailer = require('../lib/mailer.js');

//#endregion

//#region -------------------------------VARIABLES-------------------------------

var validator = require('validator');
var path = require('path');
var request = require('request');

//#endregion>

module.exports = {

  //#region -------------------------------RENDER-------------------------------

  //display main page
  renderMainPage : function(req, res, next){
    res.render("main/main_index.ejs", {
      message: auth_functions.messageReset(req),
      user: req.user
    });
  },

  //displays any page that we have a view for
  mainPageLinksRender : function(req, res, next){
    var view_name = req.path.slice(1, req.path.length);

    //append main_ to the view name
    res.render("main/main_" + view_name, {
      message: auth_functions.messageReset(req),
      user: req.user
    });
  },

  //redirect demo to compare tool
  redirectToDemo : function(req, res){
    res.redirect("/listing/cooldomains.com?compare=true&theme=Random")
  },

  //#endregion>

  //#region -------------------------------CONTACT-------------------------------

  //handle contact us form submission
  contactUs : function(req, res, next){
    console.log("MF: Checking posted message for contact us form...");

    var contact_name = req.body.contact_name;
    var contact_email = req.body.contact_email;
    var contact_message = req.body.contact_message;
    var recaptcha = req.body["g-recaptcha-response"];
    var came_from = req.header("Referer");

    if (!contact_name){
      error.handler(req, res, "Please enter your name!", "json");
    }
    else if (!validator.isEmail(contact_email)){
      error.handler(req, res, "Please enter a valid email address!", "json");
    }
    else if (!contact_message){
      error.handler(req, res, "Please say something!", "json");
    }
    //recaptcha is empty
    else if (!recaptcha && came_from.indexOf("/contact") != -1){
      error.handler(req, res, "Invalid captcha please refresh the page and try again!", "json");
    }
    //verify with google
    else {

      //if using public contact form
      if (came_from.indexOf("/contact") != -1){
        request.post({
          url: 'https://www.google.com/recaptcha/api/siteverify',
          form: {
            secret: "6LdwpykTAAAAAEMcP-NUWJuVXMLEQx1fZLbcGfVO",
            response: recaptcha
          }
        }, function (err, response, body) {
          body = JSON.parse(body);

          //all good with google!
          if (!err && response.statusCode == 200 && body.success) {
            sendDomaHubMail(req, res);
          }
          else {
            error.handler(req, res, "Invalid captcha please refresh the page and try again!", "json");
          }
        });
      }
      //else logged in
      else {
        sendDomaHubMail(req, res);
      }
    }
  },

  //#endregion>

  //#region -------------------------------404-------------------------------

  //404 not found
  notFound : function(req, res){
    var referer = req.header("Referer") || "someone";
    console.log("404! Unable to find " + req.originalUrl + " | From: " + referer);
    res.redirect('/nothinghere');
  },

  //#endregion

}

//send email to domahub
function sendDomaHubMail(req, res, next){
  error.handler(req, res, "This doesn't work anymore! It's just a demo.", "json");
  // mailer.sendBasicMail({
  //   from: req.body.contact_email,
  //   to: 'general@domahub.com',
  //   subject: '[CONTACT FORM] - ' + req.body.contact_name + ' says hello! ',
  //   text: req.body.contact_message
  // }, function(state) {
  //   if (!state){
  //     error.handler(req, res, "This page doesn't work anymore! It's just a demo.", "json");
  //   }
  //   else {
  //     //email thank you for contacting email
  //     mailer.sendEJSMail(path.resolve(process.cwd(), 'server', 'views', 'email', 'thank_you_contact.ejs'), {
  //       contact_name : req.body.contact_name
  //     }, {
  //       to: req.body.contact_email,
  //       from: 'DomaHub <general@domahub.com>',
  //       subject: 'Thank you for contacting DomaHub!',
  //     });
  //
  //     res.send({
  //       state: "success"
  //     });
  //   }
  // });
}
