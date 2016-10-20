$(document).ready(function() {
	//prevent dragging on background image
	$('#background_image').on('dragstart', function(event) { event.preventDefault(); });

	//fix 100vh jumping on mobile
	if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
		var h = $('.height-fix').height();
		$('.height-fix').height(h);
	}

	//close modal if user is logged in
	if (user){
		$("#login_modal").removeAttr("style");
	}
});
