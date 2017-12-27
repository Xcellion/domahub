module.exports = function(app){

  //development routes
  if (process.env.NODE_ENV == "dev"){
    require('./dev_routes.js')(app);
  }

  //admin routes
  require('./admin_routes.js')(app);

  //all main page (domahub) links
  require('./main_routes.js')(app);

  //authentication - signup, log in, log out, pw forgot, pw rest
  require('./auth_routes.js')(app);

  //individual user profiles - dashboard, my listings, settings
  require('./profile_routes.js')(app);

  //landing pages
  require('./listing_routes.js')(app);

  //stripe web hooks
  require('./stripe_routes.js')(app);

  //ico, rental, 404
  require('./final_routes.js')(app);

}
