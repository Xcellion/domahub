$(document).ready(function() {

    for (var x = 0; x < rentals.length; x++){
        start = moment(new Date(rentals[x].date + " UTC"));
        disp_end = moment(new Date(start._d.getTime() + rentals[x].duration)).format('YYYY/MM/DD, hh:mm A');
        disp_start = start.format('YYYY/MM/DD, hh:mm A');

        var tr = $("<tr></tr");
        tr.append("<td>" + rentals[x].domain_name + "</td>");
        tr.append("<td>" + disp_start + "</a></td>");
        tr.append("<td>" + disp_end + "</td>");
        tr.append("<td><a href='/listing/" + rentals[x].domain_name + "/" + rentals[x].rental_id + "'>Edit</a></td>");
        $("#rental_table").append(tr);
    }

  $(".delete").click(function() {
    $(this).parent().slideUp(200, function() {
      $(this).remove();
    });
  });

  var can_verify = true;

  $("#verify-link").click(function(e) {
      e.preventDefault();
      if (can_verify){
          can_verify = false;
          $.ajax({
              type: "POST",
              url: "/verify"
          }).done(function(data){
              if (data.state == "success"){
                  $("#verify-message").text("Please check your email for further instructions!");
              }
              else {
                  console.log(data);
                  $("#verify-message").text(data.message);
              }
          });
      }
  });

});
