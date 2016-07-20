var main = function() {

  $('#login').leanModal({
    top: 100,
    overlay: 0.7,
    closeButton: ".modal_close"
  });

  // $('#login').click(function () {
  //     $('#login_dropdown').toggle();
  //     $('#session').toggleClass('active');
  //     return false;
  // });
  // $('#login_dropdown').click(function(e) {
  //     e.stopPropagation();
  // });
  // $(document).click(function() {
  //     $('#login_dropdown').hide();
  //     $('#session').removeClass('active');
  // });
};

$(document).ready(main);
