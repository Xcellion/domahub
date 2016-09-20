$(document).ready(function() {
    createListingRows(listings);
    createRentalRows(rentals);
});

//create all listing rows
function createListingRows(listings){
    for (var x = 0; x < listings.length; x++){
        var tr = $("<tr></tr");
        tr.append("<td>" + listings[x].domain_name + "</td>");
        if (listings[x].price_type != 1){
            tr.append("<td><a href='/listing/" + listings[x].domain_name + "/verify" + "'>Verify</a></td>");
        }
        else {
            tr.append("<td><a href='/listing/" + listings[x].domain_name + "'>View</a></td>");
        }
        $("#listing_table").append(tr);
    }
}

//create all rental rows
function createRentalRows(rentals){
    for (var x = 0; x < rentals.length; x++){
        var tr = $("<tr></tr");
        tr.append("<td>" + rentals[x].domain_name + "</td>");
        tr.append("<td><a href='/listing/" + rentals[x].domain_name + "/" + rentals[x].rental_id + "'>Edit</a></td>");
        $("#rental_table").append(tr);
    }
}
