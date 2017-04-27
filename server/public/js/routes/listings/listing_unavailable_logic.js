$(document).ready(function(){

    //---------------------------------------------------------------------------------------------------UNAVAILABLE MAGIC BUTTON

    if (listing_info.status == 0 || listing_info.unlisted){
        var bored_meter = 0;
        var magic_text = [
            "Try again?",
            "Try again?",
            "Not giving up?",
            "Why not?",
            "You are really persistent.",
            "You really want this site?",
            "I understand.",
            "You're bored.",
            "You're really bored.",
            "Truly.",
            "Truly..",
            "Truly...",
            "Bored.",
            "So here you are.",
            "Interacting with a button.",
            "I was doing just fine...",
            "Before you came along...",
            "And now...",
            "I'm just getting poked...",
            "And poked...",
            "And poked....",
            "And poked.....",
            "You won't stop, will you?",
            "This is fun for you?",
            "What if I just disappear?",
            "",
            "Shoot.",
            "Well that didn't work.",
            "What do you even want?",
            "Why are you doing this?",
            listing_info.domain_name + "?",
            "Interesting website...",
            "Sounds pretty useful.",
            "You gonna use it?",
            "Well it's not available.",
            "I can tell you that much.",
            "Bothering me won't help.",
            "Despite what it says above.",
            "I don't know what to say.",
            "What do you want?",
            "I'm a magic button.",
            "Not a know-it-all button.",
            "...",
            "....",
            ".....",
            "......",
            ".......",
            "........",
            ".........",
            "Okay.",
            "You got me.",
            "I didn't tell you but...",
            "Fact is...",
            "Every time you press me...",
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
            "I told you it's $1 / click!",
            "You're giving me money.",
            "You're okay with that?",
            "You must be rich.",
            "Or just extremely bored.",
            "+$1",
            "+$1",
            "+$1",
            "+$1",
            "+$1",
            "Okay...",
            "Fine.",
            "Since you're so determined.",
            "I'll do some magic for you.",
            "You paid for it anyway.",
            "Haha.",
            "...",
            "....",
            ".....",
            ".....",
            "Okay, I'm joking.",
            "I don't get paid.",
            "I can't do magic.",
            "I'm just a button.",
            "A normal.",
            "Regular.",
            "Good ol' fashioned.",
            "Button.",
            "Anyways.",
            "I'm done with you.",
            "I'm going to stop now.",
            "Goodbye.",
        ]
        var magic_index = 0;

        //button doesnt do anything, but dont worry, loading the page already stored the info we needed
        $("#unavail-button").on("click", function(){
            magicButton($(this), magic_text, magic_index, bored_meter);
        });
    }
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
