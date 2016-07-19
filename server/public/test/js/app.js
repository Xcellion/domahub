var main = function() {
  $('#login').click(function () {
      $('#login_dropdown').toggle();
      $('#session').toggleClass('active');
      return false;
  });
  $('#login_dropdown').click(function(e) {
      e.stopPropagation();
  });
  $(document).click(function() {
      $('#login_dropdown').hide();
      $('#session').removeClass('active');
  });
};

$(document).ready(main);
