$(document).ready(function() {
	var bored_meter = 0;
	var magic_text = [
		"Try again?",
		"Try again?",
		"Not giving up?",
		"Why not?",
		"You're really persistent. Aren't ya?",
		"Do you really want this website?",
		"I understand.",
		"You're bored.",
		"You've got nothing else going on.",
		"So here you are--interacting with a button.",
		"I was doing just fine before you came along.",
		"And now you're just poking me.",
		"Poking...",
		"And poking...",
		"And poking...",
		"And poking...",
		"You just won't stop, will you?",
		"This is fun for you?",
		"How about if I just disappear?",
		"",
		"Shoot.",
		"Well that didn't work.",
		"What do you even want?",
		"Why are you doing this?",
		listing_info.domain_name + "?",
		"Interesting website...",
		"Sounds pretty useful.",
		"What are you gonna do with it?",
		"Well it's not available. I can tell you that much.",
		"And bothering me won't help.",
		"Despite what it says above.",
		"Not sure what you're expecting from me.",
		"What do you want me to say?",
		"Okay. You got me.",
		"I've been holding out on you.",
		"Fact is...",
		"Everytime you press me...",
		"I make $1.",
		"+$1",
		"+$1",
		"+$1",
		"+$1",
		"+$1",
		"+$1",
		"+$1",
		"+$1",
		"+$1",
		"+$1",
		"Still here?",
		"WHY???",
		"Even after I told you I make a $1 per click?!",
		"You're literally just giving me money at this point.",
		"You're okay with that?",
		"You must be rich.",
		"Or just extremely bored.",
		"Okay.",
		"I'm done with you.",
		"I'm going to stop saying new phrases now.",
		"Goodbye.",
	]
	var magic_index = 0;

	//button doesnt do anything, but dont worry, loading the page already stored the info we needed
	$("#unavail-button").on("click", function(){
		magicButton($(this), magic_text, magic_index, bored_meter);
	});

	//related domains module
	findRelatedDomains();

});

//fun function for magic button
function magicButton(button, magic_text, magic_index, bored_meter){
	button.off().addClass('is-loading');

	window.setTimeout(function(){
		button.removeClass('is-loading').text(magic_text[magic_index]).on("click", function(){
			magicButton(button, magic_text, magic_index);
		});
		if (magic_index >= magic_text.length - 1){
			magic_index = magic_text.length - 1;
			//user has reached the end
			bored_meter++;
		}
		magic_index++;
	}, 200);
}

//related domains
function findRelatedDomains(){
	if ($("#similar-domains").length > 0){
		if (listing_info.categories){
			var categories_to_post = listing_info.categories;
			$("#similar-domains-title").text('Similar Listings');
		}
		else {
			var categories_to_post = "";
			$("#similar-domains-title").text('Other Listings');
		}

		$.ajax({
			url: "/listing/related",
			method: "POST",
			data: {
				categories: categories_to_post,
				domain_name_exclude: listing_info.domain_name
			}
		}).done(function(data){
			if (data.state == "success"){
				$("#similar-domains").removeClass('is-hidden');
				for (var x = 0; x < data.listings.length; x++){
					var cloned_similar_listing = $("#similar-domain-clone").clone();
					cloned_similar_listing.removeAttr("id").removeClass('is-hidden');

					//edit it based on new listing info
					cloned_similar_listing.find(".similar-domain-price").text("$" + data.listings[x].price_rate + " / " + data.listings[x].price_type);
					// var random_sig = Math.floor(Math.random()*1000);
					// var background_image = data.listings[x].background_image || "https://source.unsplash.com/category/nature/250x200?sig=" + random_sig;
					// cloned_similar_listing.find(".similar-domain-img").attr("src", background_image);
					cloned_similar_listing.find(".similar-domain-name").text(data.listings[x].domain_name).attr("href", "/listing/" + data.listings[x].domain_name);
					$("#similar-domain-table").append(cloned_similar_listing);
				}
			}
		});
	}
}
