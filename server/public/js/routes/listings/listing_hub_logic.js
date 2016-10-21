$(document).ready(function() {

  var slider = document.getElementById('slider');

  noUiSlider.create(slider, {
  	start: [0, 5000],
  	connect: true,
    margin: 1,
    behaviour: 'drag-snap',
  	range: {
  		'min': 0,
  		'max': 5000
  	}
  });

});
