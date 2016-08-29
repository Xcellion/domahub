var can_submit = true;

$(document).ready(function() {

	for (var x = 0; x < rentals.length; x++){
		start = moment(new Date(rentals[x].date + " UTC"));
		disp_end = moment(new Date(start._d.getTime() + rentals[x].duration)).format('YYYY/MM/D, h:mmA');
		disp_start = start.format('YYYY/MM/D, h:mmA');

		var tr = $("<tr></tr");
		tr.append("<td>" + rentals[x].domain_name + "</td>");
		tr.append("<td>" + disp_start + "</a></td>");
		tr.append("<td>" + disp_end + "</td>");
		tr.append("<td><a href='/listing/" + rentals[x].domain_name + "/" + rentals[x].rental_id + "'>Edit</a></td>");
		$("#rental_table").append(tr);
	}

	$(".activate_button").click(function(e){
		id = $(this).attr("id");
		domain_name = id.substr(9, id.length);

		$.ajax({
			url: "/listing/" + domain_name + "/activate",
			data: {
				domain_name: domain_name
			}
		}).done(function(data){
			console.log(data);
		})

	});

	$("#listing_form").submit(function(e){
		e.preventDefault();
		submitListings();
	});
});

//function to sumibt listings
function submitListings(){
	if (can_submit){
		can_submit = false;
		$.ajax({
			type: "POST",
			url: "/profile",
			data: {
				domain_name: $("#listing_form_domain_name").val(),
				description: $("#listing_form_description").val()
			}
		}).done(function(data){
			can_submit = true;
			if (data.state == "success"){
				$("#message").html(data.message);

				listings.push(data.listing_info);
				var row = $("<tr></tr>");
				row.append("<td><a href=/listing/" + data.listing_info.domain_name + ">" + data.listing_info.domain_name + "</a></td>")
				var active = data.price_type != 0 ? "False" : "True";
				row.append("<td>" + active + "</td>")
				row.append("<td class='activate_button' id='activate_" + data.listing_info.domain_name + "'>Activate?</td>");
				$("#domain_table").append(row);

				//random human hash
				$("#hash_wrapper").show();
				$("#hash_code").text(data.listing_info.hash);
			}
			else if (data.state == "error"){
				$("#message").html(data.message);
			}
			else {
				console.log(data);
			}
		});
	}
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
