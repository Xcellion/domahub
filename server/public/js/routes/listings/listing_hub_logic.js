$(document).ready(function() {
  // Creating the price range slider element
  var slider = document.getElementById('slider');
  var sliderSmall = document.getElementById('sliderSmall');

  noUiSlider.create(slider, {
  	start: [1, 300],
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

  slider.noUiSlider.on('slide', function(values, handle, unencoded) {

    if (values[1] - values[0] <= 11) {

    }
  });

  noUiSlider.create(sliderSmall, {
    start: [1, 63],
    connect: true,
    margin: 1,
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

  //submit search
  $("#submit-button").click(function(e) {
    e.preventDefault();
    submitData();
  });

});

//function to get the submission data
function getSubmitData(){
    var searchData = {
        domain_name : $("#domain_name-input").val(),
        start_date : new Date($("#start_date-input").val()).getTime(),
        end_date : new Date($("#end_date-input").val()).getTime(),
        price_rate : $("#category-input").val(),
        min_price : slider.noUiSlider.get()[0],
        max_price : slider.noUiSlider.get()[1],
        categories : ""
    }

    //categories string
    $(".cat-checkbox").each(function(e){
        if ($(this).prop("checked")){
            searchData.categories += $(this).val() + " ";
        }
    });

    return searchData;
}

//function to submit
function submitData(){
    $.ajax({
        url: "/testing",
        method: "POST",
        data: getSubmitData()
    }).done(function(data){
        console.log(data);
    })
}
