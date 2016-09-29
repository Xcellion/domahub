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
		"/messages/new"
	], [
		isLoggedIn,
		checkMessage,
		getOtherId,
		createMessage
	]);

	//get chat convo
	app.post([
		"/messages/:account"
	], [
		isLoggedIn,
		getOtherId,
		getConvo
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

//function to get the id of the other person in the convo
function getOtherId(req, res, next){
	other_name = req.params.account || req.body.msg_receiver;

	if (!other_name || other_name == req.user.username || other_name.includes(" ")){
		res.redirect("/profile/inbox");
	}
	else {
		Account.getAccount(undefined, other_name, function(result){
			if (result.state=="error"){error.handler(req, res, result.info);}
			else {
				if (result.info.length > 0 && result.info[0].id != req.user.id){
					req.other_id = result.info[0].id;
					next();
				}
				else {
					res.redirect("/profile/inbox");
				}
			}
		});
	}
}

//function to create a new message
function createMessage(req, res, next){
	req.message_item.receiver_account_id = req.other_id;
	Chat.newChatMessage(req.message_item, function(result){
		if (result.state=="error"){error.handler(req, res, result.info);}
		else {
			res.json({
				state: "success"
			})
		}
	})
}

//function to get the convo of two people
function getConvo(req, res, next){
	account_id_1 = req.user.id;
	account_id_2 = req.other_id;
	length = parseFloat(req.body.length);

	if (parseFloat(length) != length >>> 0){
		error.handler(req, res, "Invalid length!", "json");
	}
	else {
		//get the chats between the two accounts now that we have the ids
		Chat.getChats(account_id_1, account_id_2, length, function(result){
			if (result.state=="error"){error.handler(req, res, result.info);}
			else {
				if (result.state == "success"){
					res.json({
						username: req.params.account,
						chats: result.info
					});
				}
				else {
					res.redirect("/profile/inbox");
				}
			}
		})
	}
}
