
$(document).ready(function() {
	$("#listing_form").submit(function(e){
		e.preventDefault();
		$("#domain_result_wrapper").hide();

		$.ajax({
			type: "POST",
			url: "/listing",
			data: {
				domain_name: $("#listing_form_domain_name").val()
			}
		}).done(function(data){
			if (data.redirect){
				window.location = window.location.href + "/" + data.redirect.domain_name;
			}
			else {
				$("#domain_result_wrapper").show();
				$(".domain_buy_link").each(function(){
					$(this).attr("href", $(this).attr("href") + data.domain);
				});
				if (data.available){
					$("#domain_available_wrapper").show();
					$("#domain_unavailable_wrapper").hide();
				}
				else {
					$("#domain_available_wrapper").hide();
					$("#domain_unavailable_wrapper").show();
				}
			}
		});
	})
});
