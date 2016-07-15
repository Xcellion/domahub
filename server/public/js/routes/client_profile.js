$(document).ready(function() {
	
	for (var x = 0; x < rentals.length; x++){
		var tr = $("<tr></tr");
		tr.append("<td>"+rentals[x].domain_name+"</td>");
		tr.append("<td>" + moment(rentals[x].date).format('YYYY-MM-DD HH:mm A') + "</a></td>");
		tr.append("<td>" + moment(new Date(rentals[x].date).getTime() + rentals[x].duration).format('YYYY-MM-DD HH:mm A') + "</td>");
		tr.append("<td><a href='/listing/" + rentals[x].domain_name + "/" + rentals[x].rental_id + "'>Rental details</a></td>");
		$("#rental_table").append(tr);
	}
});