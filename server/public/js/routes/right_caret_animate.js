$(document).ready(function() {
  $('.index-link').hover(function() {
     $(this).next().toggleClass('active');
  });
});
