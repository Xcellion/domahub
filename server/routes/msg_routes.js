var	chat_model = require('../models/chat_model.js');
var	account_model = require('../models/account_model.js');

var sanitizeHtml = require("sanitize-html");
var validator = require("validator");

module.exports = function(app, db, auth, e){
	Auth = auth;
	error = e;

	Chat = new chat_model(db);
	Account = new account_model(db);
	isLoggedIn = Auth.isLoggedIn;

	//new message
	app.post([
		"/messages"
	], [
		isLoggedIn,
		checkMessage,
		getRecipientId,
		createMessage
	]);
}

//function to check the formatting of the message
function checkMessage(req, res, next){
	message = sanitizeHtml(req.body.msg_text);

	if (!message){
		error.handler(req, res, "Invalid message!", "json");
	}
	else {
		req.message_item = {
			sender_account_id: req.user.id,
			message: message
		}
		next();
	}
}

//function to get the recipient account id
function getRecipientId(req, res, next){
	receiver_email = req.body.msg_receiver;

	if (!receiver_email || !validator.isEmail(receiver_email)){
		error.handler(req, res, "Invalid recipient!", "json");
	}
	else {
		Account.getAccount(receiver_email, function(result){
			if (result.state=="error"){error.handler(req, res, result.info);}
			else {
				if (result.info.length > 0 && result.info[0].id != req.user.id){
					req.message_item.receiver_account_id = result.info[0].id;
					next();
				}
				else {
					error.handler(req, res, "Invalid recipient!", "json");
				}
			}
		})
	}
}

//function to create a new message
function createMessage(req, res, next){
	console.log(req.message_item);
	Chat.newChatMessage(req.message_item, function(result){
		if (result.state=="error"){error.handler(req, res, result.info);}
		else {
			res.json({
				state: "success"
			})
		}
	})
}
