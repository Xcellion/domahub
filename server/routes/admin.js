var path = require('path'),
	app,
	database;

var	admin_model = require('../models/admin_model.js'),
	Admin;

module.exports = function(app_pass, db){
	app = app_pass;
	database = db;
	
	Admin = new admin_model(database);
}