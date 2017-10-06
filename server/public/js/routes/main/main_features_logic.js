$(document).ready(function() {
  // initialize slick carousel
  $(".features-carousel").slick({
    dots: true,
    arrows: false,
    slidesToShow: 1,
    focusOnSelect: false,
    appendDots: $("#dotted"),
    fade: true
  });

  // listen for change to current slide
  $(".features-carousel").on('beforeChange', function(event, slick, currentSlide, nextSlide) {
    var blurbs = ["#offers", "#design", "#emails", "#rentals", "#other"];

    // hide blurbs, duh
    hideBlurbs();

    // display the appropriate slide
    switch (nextSlide) {
      case 0:
          $(blurbs[0]).removeClass("is-hidden");
          updateHash(blurbs[0]);
          break;
      case 1:
          $(blurbs[1]).removeClass("is-hidden");
          updateHash(blurbs[1]);
          break;
      case 2:
          $(blurbs[2]).removeClass("is-hidden");
          updateHash(blurbs[2]);
          break;
      case 3:
          $(blurbs[3]).removeClass("is-hidden");
          updateHash(blurbs[3]);
          break;
      case 4:
          $(blurbs[4]).removeClass("is-hidden");
          updateHash(blurbs[4]);
          break;
    }
  });

  // read hash and go to appropriate slide
  window.onload = goToSlide();

});

// hide all blurbs
function hideBlurbs() {
  return $(".blurb").addClass("is-hidden");
}

// update hash
function updateHash(hash) {
  return history.replaceState({},"",hash);
}

// go to appropriate slide
function goToSlide() {
  var slide = location.hash.substring(1);
  var number = 0;

  switch (slide) {
    case "offers":
        number = 0;
        break;
    case "design":
        number = 1;
        break;
    case "emails":
        number = 2;
        break;
    case "rentals":
        number = 3;
        break;
    case "other":
        number = 4;
        break;
    default:
        number = -1;
  }

  if (number >= 0) {
    $('html, body').animate({
        scrollTop: $("#features-section").offset().top
    }, 1000);
    return $(".features-carousel").slick("slickGoTo", number);
  }
  else {
    return false;
  }

}
