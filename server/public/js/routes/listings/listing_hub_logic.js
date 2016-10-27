$(document).ready(function() {
  // Creating the price range slider element
  var slider = document.getElementById('slider');
  var sliderSmall = document.getElementById('sliderSmall');

  // Large price slider
  noUiSlider.create(slider, {
  	start: [134, 145],
  	connect: true,
    margin: 0,
    behaviour: 'drag-snap',
    tooltips: [wNumb({decimals: 0, prefix: '$'}), wNumb({decimals: 0, prefix: '$'})],
    step: 1,
  	range: {
  		'min': 1,
  		'max': 300
  	},
  });

  // Tooltips movement on large slider
  slider.noUiSlider.on('slide', function(values, handle, unencoded, tap, positions) {
    console.log(values[1] - values[0]);
    if ((values[1] - values[0] < 12) && (values[1] !== values[0])) {
      // if (handle == 1) {
      //   $($(".noUi-tooltip")[0]).css("left", function(current) {
      //     return  - 1;
      //   });
      // }
      // else {
      //   $($(".noUi-tooltip")[1]).css("left");
      // }
      $(".noUi-tooltip").addClass("is-hidden");
    }
    else if (values[1] == values[0]) {
      $(".noUi-tooltip").removeClass("is-hidden");
    }
    else {
      $(".noUi-tooltip").removeClass("is-hidden");
    }
  });

  // Small char slider
  noUiSlider.create(sliderSmall, {
    start: [1, 63],
    connect: true,
    margin: 0,
    behaviour: 'drag-snap',
    tooltips: [wNumb({decimals: 0}), wNumb({decimals: 0})],
    step: 1,
    range: {
      'min': 1,
      'max': 63
    }
  });

  // Add is-small class to sliderSmall
  $("#sliderSmall").addClass("is-small");

  // Filter dropdown logic
  $("#filter-open-button").click(function() {
    $(this).parents(".listing-buttons").addClass("is-hidden");
    $("#listings-table").addClass("is-hidden");
    $("#filter-dropdown").removeClass("is-hidden");
  });

  $("#filter-cancel-button, #filter-apply-button").click(function() {
    $("#filter-dropdown").addClass("is-hidden");
    $(this).parents().parents().siblings(".listing-buttons").removeClass("is-hidden");
    $("#listings-table").removeClass("is-hidden");
  });

});
