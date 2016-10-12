var	chat_model = require('../models/chat_model.js');
var	account_model = require('../models/account_model.js');

var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

var sanitizeHtml = require("sanitize-html");
var validator = require("validator");
var dateFormat = require('dateformat');

module.exports = function(app, db, auth, e){
	Auth = auth;
	error = e;

	Chat = new chat_model(db);
	Account = new account_model(db);
	checkLoggedIn = Auth.checkLoggedIn;

	//new message
	app.post([
		"/messages/new"
	], [
		urlencodedParser,
		checkLoggedIn,
		checkMessage,
		getOtherId,
		createMessage
	]);

	//get chat convo
	app.post([
		"/messages/:account"
	], [
		urlencodedParser,
		checkLoggedIn,
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

	if (!other_name || other_name.includes(" ")){
		res.json({
			state: "error",
			message: "Please enter a valid username to send the message to!"
		});
	}
	else if (other_name.toLowerCase() == req.user.username.toLowerCase()){
		res.json({
			state: "error",
			message: "You can't message yourself!"
		});
	}
	else {
		Account.getAccount(undefined, other_name, function(result){
			if (result.state=="error"){error.handler(req, res, result.info);}
			else {
				if (result.info.length > 0){
					req.other_id = result.info[0].id;
					req.username = result.info[0].username;
					next();
				}
				else if (result.info[0].id != req.user.id){
					res.json({
						state: "error",
						message: "You can't message yourself!"
					});
				}
				else {
					res.json({
						state: "error",
						message: "No such account exists!"
					});
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
			req.message_item.id = result.info.insertId;
			req.message_item.seen = 0;
			req.message_item.timestamp = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss", true);

			refreshConvos(req.user.convo_list, req.message_item, req.username);
			delete req.message_item;
			res.json({
				state: "success",
				target_username: req.username,
				convo_list: req.user.convo_list
			});
		}
	})
}

//function to refresh user.convos object, bringing newest message_item to the front;
function refreshConvos(convo_list, message_item, username){
	//if convo doesnt exist, loop through to find the correct one
	if (convo_list.length > 0){
		for (var x = 0; x < convo_list.length; x++){
			if (convo_list[x].username.toLowerCase() == username.toLowerCase()){
				convo_list[x].message = message_item.message;
				convo_list[x].timestamp = message_item.timestamp;

				//if chats doesnt exist, create it
				if (!convo_list[x].chats){
					convo_list[x].chats = [];
				}

				//add to the chats field
				convo_list[x].chats.unshift(message_item);

				var move_to_front = convo_list.splice(x, 1);
				break;
			}
		}
		convo_list.unshift(move_to_front[0]);
	}
	else {
		convo_list.unshift({
			message: message_item.message,
			seen: 0,
			timestamp: dateFormat(new Date(), "yyyy-mm-dd h:MM:ss", true),
			username: username,
			chats: [message_item]
		})
	}
}

//function to add chats to req.user.convo_list
function addToConvoList(convo_list, username, chats){
	for (var x = 0; x < convo_list.length; x++){
		if (convo_list[x].username.toLowerCase() == username.toLowerCase()){
			if (convo_list[x].chats){
				var temp_array = [];
		        temp_array.push.apply(temp_array, convo_list[x].chats);
		        temp_array.push.apply(temp_array, chats);
		        convo_list[x].chats = temp_array;
			}
			else {
				convo_list[x].chats = chats;
			}
		}
	}
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
					addToConvoList(req.user.convo_list, req.params.account, result.info)
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
