$(document).ready(function() {
    createListingRows(listings);
    createRentalRows(rentals);
});

//create all listing rows
function createListingRows(listings){
    if (listings && listings.length > 0){
        for (var x = 0; x < listings.length; x++){
            var tr = $("<tr></tr");
            tr.append("<td>" + listings[x].domain_name + "</td>");
            if (listings[x].status == 0){
                tr.append("<td><a href='/listing/" + listings[x].domain_name + "/verify" + "'>Verify</a></td>");
            }
            else {
                tr.append("<td><a href='/listing/" + listings[x].domain_name + "'>View</a></td>");
            }
            $("#listing_table").append(tr);
        }
    }
    else {
        var tr = $("<tr></tr");
        tr.append("<td colspan='2'>You currently have no listings!</td>");
        $("#listing_table").append(tr);
    }
}

//create all rental rows
function createRentalRows(rentals){
    if (rentals && rentals.length > 0){
        for (var x = 0; x < rentals.length; x++){
            var tr = $("<tr></tr");
            tr.append("<td><a href='/listing/" + rentals[x].domain_name + "/" + rentals[x].rental_id + "'>" + rentals[x].domain_name + "</a></td>");
            var active = (rentals[x].active == 1) ? "Active" : "Inactive";
            tr.append("<td>" + active + "</td>");
            $("#rental_table").append(tr);
        }
    }
    else {
        var tr = $("<tr></tr");
        tr.append("<td colspan='2'>You currently have no rentals!</td>");
        $("#rental_table").append(tr);
    }
}
