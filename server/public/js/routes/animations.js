$(document).ready(function() {

$('#renter_tab').addClass('active');
$('#renter_faq').show();

$('#renter_tab').click(function() {
  if ($('#seller_tab').hasClass('active')) {
      $('#seller_tab').removeClass('active');
      $(this).addClass('active');
      $('#seller_faq').hide();
      $('#renter_faq').show();
  }
  else {
    $(this).addClass('active');
    $('#renter_faq').show();
  }
});

$('#seller_tab').click(function() {
  if ($('#renter_tab').hasClass('active')) {
      $('#renter_tab').removeClass('active');
      $(this).addClass('active');
      $('#renter_faq').hide();
      $('#seller_faq').show();
  }
  else {
    $(this).addClass('active');
    $('#seller_faq').show();
  }
});

});
