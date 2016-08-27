
$(document).ready(function() {
	$("#domain_result_wrapper").show();
	$(".domain_buy_link").each(function(){
		$(this).attr("href", $(this).attr("href") + available.domain);
	});
	if (available.available){
		$("#domain_available_wrapper").show();
		$("#domain_unavailable_wrapper").hide();
	}
	else {
		$("#domain_available_wrapper").hide();
		$("#domain_unavailable_wrapper").show();
	}
});
