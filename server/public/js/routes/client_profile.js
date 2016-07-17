$(document).ready(function() {

	for (var x = 0; x < rentals.length; x++){
		var tr = $("<tr></tr");
		tr.append("<td>"+rentals[x].domain_name+"</td>");
		tr.append("<td>" + moment(rentals[x].date).format('YYYY-MM-DD HH:mm A') + "</a></td>");
		tr.append("<td>" + moment(new Date(rentals[x].date).getTime() + rentals[x].duration).format('YYYY-MM-DD HH:mm A') + "</td>");
		tr.append("<td><a href='/listing/" + rentals[x].domain_name + "/" + rentals[x].rental_id + "'>Rental details</a></td>");
		$("#rental_table").append(tr);
	}

	$("#listing_form").submit(function(e){
		e.preventDefault();
		submitListings();
	});
});

//function to sumibt listings
function submitListings(){
	$.ajax({
		type: "POST",
		url: "/profile",
		data: {
			domain_name: $("#listing_form_domain_name").val(),
			description: $("#listing_form_description").val()
		}
	}).done(function(data){
		if (data.state == "success"){
			$("#message").html(data.message);
		}
		else if (data.state == "error"){
			$("#message").html(data.message);
		}
		else {
			console.log(data);
		}
	});
}

//function to set a domain as active
function changeActive(domain_name){
	$.ajax({
		type: "POST",
		url: "/profile/changeActive",
		data: {
			domain_name: domain_name,
		}
	}).done(function(data){
		if (data.state == "success"){
			$("#message").html(data.message);
		}
		else if (data.state == "error"){
			$("#message").html(data.message);
		}
		else {
			console.log(data);
		}
	});
}
