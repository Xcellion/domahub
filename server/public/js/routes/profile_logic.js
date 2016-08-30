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

  $(".delete").click(function() {
    $(this).parent().hide(200);
  });
});
