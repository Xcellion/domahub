$(document).ready(function() {
  $('.index_link').hover(function() {
     $(this).next().toggleClass('active');
  });
});
