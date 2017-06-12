//<editor-fold>-------------------------------NODE REQUIREMENTS-------------------------------

var node_env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool

var PNF = require('google-libphonenumber').PhoneNumberFormat;
var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
var randomstring = require("randomstring");

var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var mailOptions = {
    auth: {
        api_key: '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'
    }
}
var mailer = nodemailer.createTransport(sgTransport(mailOptions));

var ejs = require('ejs');
var path = require("path");

var wNumb = require("wnumb");
var moneyFormat = wNumb({
    thousand: ',',
    prefix: '$',
    decimals: 0
});

//</editor-fold>

module.exports = {

    //<editor-fold>-------------------------------------BUYING A LISTING CHECKOUT-------------------------------------

    redirectToCheckout : function(req, res, next){
        req.session.new_buying_info = {
            domain_name : req.params.domain_name,
            offerer_name : req.body.contact_name,
            offerer_email : req.body.contact_email,
            offerer_phone : phoneUtil.format(phoneUtil.parse(req.body.contact_phone), PNF.INTERNATIONAL),
            offer : req.body.contact_offer,
            message : req.body.contact_message
        };

        res.send({
            state: "success"
        });
    },

    //renders the checkout page for creating a new rental
    renderCheckout : function(req, res, next){
        if (req.session.new_buying_info && req.session.new_buying_info.domain_name == req.params.domain_name){
            console.log("F: Rendering listing checkout page...");

            res.render("listings/listing_checkout_buy.ejs", {
                user: req.user,
                message: Auth.messageReset(req),
                listing_info: req.session.listing_info,
                new_buying_info: req.session.new_buying_info
            });
        }
        else {
            console.log("F: Not checking out! Redirecting to listings page...");

            res.redirect("/listing/" + req.params.domain_name);
        }
    },

    //</editor-fold>

    //<editor-fold>-------------------------------------BUY A LISTING-------------------------------------

    //create a record for this purchase
    createBuyContactRecord : function(req, res, next){
        console.log("F: Creating a new contact buy record...");

        req.session.new_buying_info.verification_code = randomstring.generate(10);

        var contact_details = {
            listing_id : req.session.listing_info.id,
            timestamp : new Date().getTime(),
            name : req.session.new_buying_info.offerer_name,
            email : req.session.new_buying_info.offerer_email,
            phone : req.session.new_buying_info.offerer_phone,
            message : req.session.new_buying_info.message,
            verification_code : req.session.new_buying_info.verification_code,
            bin : true
        }

        Data.newListingContactHistory(req.session.listing_info.domain_name, contact_details, function(result){
            if (result.state == "success"){
                next();
            }
            else {
                error.handler(req, res, "Something went wrong! Please refresh the page and try again.", "json");
            }
        });
    },

    //alert the owner that a new BIN came through
    alertOwnerBIN : function(req, res, next){
        console.log("F: Alerting the owner of a new BIN purchase!");

        //get the listing owner contact information to email
        var email_contents_path = (node_env == "dev") ? path.resolve(process.cwd(), 'server', 'views', 'email', 'bin_notify_owner.ejs') : path.resolve(process.cwd(), 'views', 'email', 'bin_notify_owner.ejs');
        var price_formatted = moneyFormat.to(parseFloat(req.session.listing_info.buy_price));
        var EJSVariables = {
            domain_name: req.session.listing_info.domain_name,
            owner_name: req.session.listing_info.username,
            buy_price: price_formatted,

            offerer_name: req.session.new_buying_info.offerer_name || "Somebody",
            offerer_email: req.session.new_buying_info.offerer_email || "Undisclosed",
            offerer_phone: req.session.new_buying_info.offerer_phone || "Undisclosed",
            message: req.session.new_buying_info.message || "No message."
        }
        var emailDetails = {
            to: req.session.listing_info.owner_email,
            from: '"DomaHub Domains" <general@domahub.com>',
            subject: 'Somebody just purchased ' + req.params.domain_name + " for " + price_formatted + "!"
        };

        //email the owner
        emailSomeone(req, res, email_contents_path, EJSVariables, emailDetails, false);

        next();
    },

    //alert the buyer of next steps
    alertBuyerNextSteps : function(req, res, next){
        console.log("F: Alerting the buyer of next steps!");

        //get the listing owner contact information to email
        var email_contents_path = (node_env == "dev") ? path.resolve(process.cwd(), 'server', 'views', 'email', 'bin_notify_buyer.ejs') : path.resolve(process.cwd(), 'views', 'email', 'bin_notify_buyer.ejs');

        var price_formatted = moneyFormat.to(parseFloat(req.session.listing_info.buy_price));
        var EJSVariables = {
            domain_name: req.session.listing_info.domain_name,
            owner_name: req.session.listing_info.username,
            owner_email: req.session.listing_info.owner_email,
            buy_price: price_formatted,

            offerer_name: req.session.new_buying_info.offerer_name || "Somebody",
            offerer_email: req.session.new_buying_info.offerer_email || "Undisclosed",
            offerer_phone: req.session.new_buying_info.offerer_phone || "Undisclosed",
            message: req.session.new_buying_info.message || "No message.",

            verification_code : req.session.new_buying_info.verification_code,
        }
        var emailDetails = {
            to: req.session.new_buying_info.offerer_email,
            cc: "",
            from: '"DomaHub Domains" <general@domahub.com>',
            subject: 'Congratulations on your recent purchase of ' + req.params.domain_name + " for " + price_formatted + "!"
        };

        //email the owner
        emailSomeone(req, res, email_contents_path, EJSVariables, emailDetails, false);

        next();
    },

    //delete the BIN info
    deleteBINInfo : function(req, res, next){
        delete req.session.new_buying_info;
        next();
    },

    //set status to 0
    disableListing : function(req, res, next){
        req.session.new_listing_info = {
            status : 0
        }

        next();
    },

    //</editor-fold>

    //<editor-fold>-------------------------------------VERIFICATION OF TRANSFER-------------------------------------

    //function to check verification code and render the verification page
    checkListingPurchaseVerificationCode : function(req, res, next){
        Listing.checkListingPurchaseVerificationCode(req.params.domain_name, req.params.verification_code, function(result){
            if (result.state == "success" && result.info.length > 0){
                next();
            }
            else {
                res.redirect("/listing/" + req.params.domain_name);
            }
        });
    },

    //function to render the transfer ownership verifcation page
    renderVerificationPage : function(req, res, next){
        res.render("listings/transfer_verify.ejs", {
            domain_name : req.params.domain_name,
            verification_code: req.params.verification_code
        });
    },

    //function to verify that ownership transferred
    verifyTransferOwnership : function(req, res, next){
        res.send({
            state: "success"
        });
    },

    //</editor-fold>

}

//helper function to email someone
function emailSomeone(req, res, pathEJSTemplate, EJSVariables, emailDetails, errorMsg){
    //read the file and add appropriate variables
    ejs.renderFile(pathEJSTemplate, EJSVariables, null, function(err, html_str){
        if (err && errorMsg){
            console.log(err);
            error.handler(req, res, errorMsg, "json");
        }
        else {
            emailDetails.html = html_str;

            //send email
            mailer.sendMail(emailDetails, function(err) {
                if (errorMsg){
                    if (err) {
                        console.log(err);
                        error.handler(req, res, errorMsg, "json");
                    }
                    else {
                        res.send({
                            state: "success"
                        });
                    }
                }
            });
        }
    });
}