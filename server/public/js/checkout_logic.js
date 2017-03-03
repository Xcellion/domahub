var unlock = true;

$(document).ready(function() {
	//---------------------------------------------------------------------------------------------------stripe

	//key for stripe
	if (window.location.hostname == "localhost"){
        Stripe.setPublishableKey('pk_test_kcmOEkkC3QtULG5JiRMWVODJ');
    }
    else {
        Stripe.setPublishableKey('pk_live_506Yzo8MYppeCnLZkW9GEm13');
    }

	//format all stripe inputs
	$('#cc-num').payment('formatCardNumber');
	$('#cc-exp').payment('formatCardExpiry');
	$('#cc-cvc').payment('formatCardCVC');
	$('#cc-zip').payment('restrictNumeric');

	//request a token from stripe
	$("#stripe-form").submit(function(){
    	Stripe.card.createToken($(this), function(status, response){
			unlock = true;
			if (response.error){
				$('#checkout-button').removeClass('is-loading');
				$("#stripe-error-message").text(response.error.message).addClass('is-danger');
			}
			//all good!
			else {
				submitStripe(response.id);
			}
		});
	    return false;
	})

	//to remove any stripe error messages
	$(".stripe-input").on("change keyup paste", function(){
		if ($("#stripe-error-message").hasClass('is-danger')){
			$("#stripe-error-message").text("Please enter your payment information.").removeClass('is-danger');
		}

		var card_type = $.payment.cardType($("#cc-num").val());
		if (card_type == "dinersclub") { card_type = "diners-club"}
		if (["maestro", "unionpay", "forbrugsforeningen", "dankort"].indexOf(card_type) != -1){ card_type = null}

		//show appropriate card icon
		if ($(".fa-cc-" + card_type) && card_type){
			$("#cc-icon").removeClass();
			$("#cc-icon").addClass("fa fa-cc-" + card_type);
		}
		//or show default
		else {
			$("#cc-icon").removeClass();
			$("#cc-icon").addClass("fa fa-credit-card");
		}
	});
	$("#agree-to-terms").on('change', function(){
		if ($("#stripe-error-message").hasClass('is-danger')){
			$("#stripe-error-message").text("Please enter your payment information.").removeClass('is-danger');
		}
	});

	//checkout button
	$('#checkout-button').click(function(e){
		$(this).addClass('is-loading');
		e.preventDefault();
		var bool = checkSubmit();
		if (bool == true && unlock){
			unlock = false;
			$("#stripe-form").submit();
		}
		else {
			$(this).removeClass('is-loading');
		}
	});

});
