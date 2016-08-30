module.exports = function(app, auth){
	Auth = auth;

    //array of all views from the main page
    main_page_routes = [
		"/about",		//aka company.ejs
		"/mission",		//aka company.ejs
		"/press",		//aka company.ejs
		"/faq",			//aka company.ejs
		"/careers",
		"/contact",
		"/getstarted",
		"/privacy",
        "/sellers",
		"/tos"
    ]

	//default page
	app.get("/", renderMainPage);

    //routes any of the above routes to the appropriate view
	app.get(main_page_routes, mainPageLinksRender);
}

//display main page
function renderMainPage(req, res, next){
	res.render("main_index", {
		message: Auth.messageReset(req),
		user: req.user
	});
}

//displays any page that we have a view for
function mainPageLinksRender(req, res, next){
	var view_name = req.path.slice(1, req.path.length);

	//routes for the company pages
	var about_us_routes = [
		"about",
		"mission",
		"press",
		"faq"
	];

	if (about_us_routes.indexOf(view_name) != -1){
		view_name = "company";
	}

	//append main_ to the view name
	res.render("main_" + view_name, {
		message: Auth.messageReset(req),
		user: req.user
	});
}
