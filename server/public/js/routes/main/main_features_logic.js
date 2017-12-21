$(document).ready(function() {

  //autoplay videos
  $("#carousel").on('init', function(ev, el){
    $("#carousel .columns").removeClass('is-hidden');
    $('.feature-video').each(function () {
      this.play();
    });
  });

  // listen for change to current slide
  $("#carousel").on('beforeChange', function(event, slick, currentSlide, nextSlide) {
    var blurbs = ["#stats", "#sales", "#design", "#advertisment", "#rentals", "#other"];
    updateHash(blurbs[nextSlide]);
  });

  //initialize slick carousel
  $("#carousel").slick({
    dots: true,
    arrows: false,
    slidesToShow: 1,
    focusOnSelect: false,
    appendDots: $("#carousel")
  });

  // read hash and go to appropriate slide
  window.onload = goToSlide();

});

//update hash
function updateHash(hash) {
  return history.replaceState({},"",hash);
}

//go to appropriate slide
function goToSlide() {
  var slide = location.hash.substring(1);
  var number = 0;

  switch (slide) {
    case "stats":
      number = 0;
      break;
    case "sales":
      number = 1;
      break;
      case "design":
      number = 2;
      break;
    case "advertisement":
      number = 3;
      break;
    case "rentals":
      number = 4;
      break;
    case "other":
      number = 5;
      break;
    default:
      number = -1;
  }

  if (number >= 0) {
    return $("#carousel").slick("slickGoTo", number);
  }
  else {
    return false;
  }

}
