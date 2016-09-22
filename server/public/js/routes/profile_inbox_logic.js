var can_submit = true;

$(document).ready(function() {

    createConvos();

    //enter to submit
    $("#msg_text_input").keypress(function(e){
        if (e.which == 13) {
            e.preventDefault();
            $("#messenger_form").submit();
        }
    });

    $("#messenger_form").submit(function(e){
        e.preventDefault();
        submit_data = checkMessage();

        if (can_submit && submit_data){
            can_submit = false;
            $.ajax({
    			type: "POST",
    			url: "/messages",
    			data: submit_data
    		}).done(function(data){
    			if (data.state == "success"){
                    createConvoMsg({
                        message: $("#msg_text_input").val()
                    }, false);

                    //reset the data to default value
                    $(".to-reset").val("");
        			can_submit = true;
    			}
    			else if (data.state == "error"){
                    console.log(data.message);
    			}
    			else {
    				console.log(data);
    			}
    		});
        }
        else {
            //please wait
        }
    })
});

//--------------------------------------------------------------------------------SUBMIT

//client side function to check message format
function checkMessage(){
    msg_receiver = $("#msg_receiver_input").val();
    msg_text = $("#msg_text_input").val();

    if (!msg_receiver){
        console.log("invalid person");
    }
    else if (!msg_text){
        console.log("no message");
    }
    else {
        return {
            msg_receiver: msg_receiver,
            msg_text: msg_text
        };
    }

    return false;
}

//--------------------------------------------------------------------------------DISPLAY

//function to create all chat convos on the left
function createConvos(){
    if (chat_history){
        //side panel convo list
        for (var x = 0; x < chat_history.length; x++){
            $(".panel-list").append(createPanelConvo(chat_history[x]));
        }
    }
}

//function to display a single chat convo on the left
function createPanelConvo(convo_item){
    var latest_time = moment(new Date(convo_item.timestamp + "Z"));
    var moment_now = moment(new Date());
    var diff_to_now = moment_now.diff(latest_time);
    var diff_to_lny = latest_time.diff(moment(new Date("01/01/" + (moment_now.year() - 1))));

    //less than a day
    if (diff_to_now < 86400000){
        var disp_time = latest_time.format("H:mma");
    }
    //less than a week
    else if (diff_to_now < 604800000){
        var disp_time = latest_time.format("ddd");
    }
    //less than last year
    else if (diff_to_now < diff_to_lny){
        var disp_time = latest_time.format("MMM DD");
    }
    //greater than last year
    else {
        var disp_time = latest_time.format("YYYY/MM/DD");
    }

    var panel_block = $("<a class='panel-block'></a>");
        var panel_icon = $("<span class='panel-icon'></span>");
            var panel_i = $("<i class='fa fa-user'></i>");
        var name = (convo_item.username.length > 20) ? convo_item.username.substr(0, 20) + "..." : convo_item.username;
        var panel_p = $("<p class='is-pulled-right'>" + disp_time + "</p>");

    //to change the convo
    panel_block.click(function(e){
        $.ajax({
            type: "POST",
            url: "/messages/" + convo_item.username
        }).done(function(data){
            changeConvo(data);
        });
    })

    return panel_block.append(panel_icon.append(panel_i), name, panel_p);
}

//function to change selected convo
function changeConvo(convo_item){
    $("#msg_wrapper").empty();

    //changing to a conversation
    if (convo_item){
        for (var x = 0; x < convo_item.chats.length; x++){
            $("#msg_wrapper").append(createConvoMsg(convo_item.chats[x]), true);
        }
        $("#msg_receiver_input").val(convo_item.username).addClass("is-disabled");
    }
    //changing to a totall new convo
    else {

    }
}

//function to create a single msg from a chat convo
function createConvoMsg(chat_item, bool){
    //came from server
    if (bool){
        var timestamp = moment(new Date(chat_item.timestamp + "Z")).format("M/DD, H:mma");
        var send_or_not = (chat_item.sender_account_id == user.id) ? "sender_me" : "sender_them";
    }
    else {
        var timestamp = moment(new Date()).format("M/DD, H:mma");
        var send_or_not = "sender_me";
    }
    var temp_div = $("<div class='message_wrapper " + send_or_not + "'></div>");
        var temp_msg = $("<p class='chat_message'>" + chat_item.message + "</p>");
        var temp_timestamp = $("<p class='chat_timestamp'>" + timestamp + "</p>");
    temp_div.append(temp_msg, temp_timestamp);

    return temp_div;
}
