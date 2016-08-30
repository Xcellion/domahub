var renderPage = function(pathName) {
  $(".section").addClass("is-hidden");
  pathName = "#" + pathName;
  $(pathName).removeClass("is-hidden").addClass("is-active");
}

window.onpopstate = function(event) {

}

$(document).ready(function() {

  var path = window.location.pathname;
  var pathName = path.substr(1, path.length);

  renderPage(pathName);

  $(".tab").click(function() {
    var tabName = $(this).attr("id").split("_").shift();

    $(".tab").removeClass("is-active");
    $(this).addClass("is-active");
    renderPage(tabName);

    var stateObj = { page: tabName};
    history.pushState(stateObj, "", tabName);
  });

// $('#renter_tab').addClass('active');
// $('#renter_faq').show();
//
// $('#renter_tab').click(function() {
//   if ($('#seller_tab').hasClass('active')) {
//       $('#seller_tab').removeClass('active');
//       $(this).addClass('active');
//       $('#seller_faq').hide();
//       $('#renter_faq').show();
//   }
//   else {
//     $(this).addClass('active');
//     $('#renter_faq').show();
//   }
// });
//
// $('#seller_tab').click(function() {
//   if ($('#renter_tab').hasClass('active')) {
//       $('#renter_tab').removeClass('active');
//       $(this).addClass('active');
//       $('#renter_faq').hide();
//       $('#seller_faq').show();
//   }
//   else {
//     $(this).addClass('active');
//     $('#seller_faq').show();
//   }
// });

});
