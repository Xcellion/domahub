$(document).ready(function() {

  //visually present which feature is being animated and then play the respective animation
  $(".feature").on("click", function() {
    $(".feature").removeClass("is-active").addClass("is-inactive");
    $(this).removeClass("is-inactive").addClass("is-active");

    var feature = $(this).attr("data-feature");

    if (feature == 0) {
      typeForm();
    }
    if (feature == 1) {
      buyItNow();
    }
    if (feature == 2) {
      minimumPrice();
    }
  });

});

//revert everything back to the original state
function revertState() {
  $(".blackscreen").removeClass("is-active");
  $(".demo").addClass("is-hidden");
  $(".button").removeClass("shrink");
  $(".contact-input").val("");
  $("#contact_message").text("");
  $(".feature").removeClass("is-active is-inactive");
}

//function to show a blackscreen on top of the form
function showBlackscreen(type, message) {
  setTimeout(function() {
    $(".blackscreen").addClass("is-active");
    $("#loader").removeClass("is-hidden");
  },300);

  setTimeout(function() {
    $("#offer-notification").removeClass("is-hidden is-primary is-danger").addClass("is-" + type).html(message);
    $("#loader").addClass("is-hidden");
  },800);

  setTimeout(function() {
    return revertState();
  }, 3000);
}

//type a single line in the form (recursive)
function typeInput(index, elements, values, callback) {

  if (index < elements.length) {
    new Typed(elements[index], {
      typeSpeed: 15,
      bindInputFocusEvents: true,
      showCursor: false,
      strings: [values[index]],
      onComplete: function() {
        index++;
        typeInput(index, elements, values, callback);
      }
    });
  }
  else {
    callback();
  }
}

//function to complete the form animation
function typeForm() {

  var elementsForm = ["#contact_name", "#contact_email", "#contact_phone", "#contact_offer", "#contact_message"];
  var stringsForm = ["Matt Mathews", "matt.matthews@gmail.com", "201-555-0313", "2500", "Great domain, hope you like my offer!"];

  $(".contact-input").text("");

  typeInput(0, elementsForm, stringsForm, function() {
    $("#send-offer-button").addClass("shrink");
    showBlackscreen("primary", "Success! You must verify this offer via email before it is sent to the domain owner.")
  });
}

function buyItNow() {
  var elementsForm = ["#contact_name", "#contact_email", "#contact_phone"];
  var stringsForm = ["Matt Mathews", "matt.matthews@gmail.com", "201-555-0313"];

  var elementsCheckout = ["#cc-num", "#cc-exp", "#cc-cvc", "#cc-zip"];
  var stringsCheckout = ["4242 4242 4242 4242", "03/22", "4242", "42424"];

  typeInput(0, elementsForm, stringsForm, function() {
    $("#buy-now-button").addClass("shrink");

    setTimeout(function() {
      $(".blackscreen").addClass("is-active");
    },300);

    setTimeout(function() {
      $("#checkout-form").removeClass("is-hidden");
      typeInput(0, elementsCheckout, stringsCheckout, function() {
        $("#confirm-purchase-button").addClass("shrink");

        setTimeout(function() {
          $("#checkout-form").addClass("is-hidden");
          $("#loader").removeClass("is-hidden");
        }, 300);

        setTimeout(function() {
          $("#loader").addClass("is-hidden");
          $("#offer-notification").removeClass("is-hidden is-danger").addClass("is-primary").html("Congratulations on your purchase! Check your email for further instructions.");
        }, 800);

        setTimeout(function() {
          return revertState();
        }, 2000);
      });
    },400);
  });
}

function minimumPrice() {
  var elementsForm = ["#contact_name", "#contact_email", "#contact_phone", "#contact_offer", "#contact_message"];
  var stringsForm = ["Matt Mathews", "matt.matthews@gmail.com", "201-555-0313", "500", "Please accept, this is all I can afford..."];

  typeInput(0, elementsForm, stringsForm, function() {
    $("#send-offer-button").addClass("shrink");
    showBlackscreen("danger", "Your offer is below the minimum price! Please enter at least $2,500.")
  });
}
