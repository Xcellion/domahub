var can_submit = true;
var chat_panels = convo_list.slice();

$(document).ready(function() {

    createPanel(chat_panels);     //create the convo list panel on the left

    //for searching for a specific user
    $("#search-user").keyup(function(e){
        var needle = $(this).val();

        if (needle){
            var temp_rows = [];
            for (var x = 0; x < convo_list.length; x++){
                temp_username = convo_list[x].username
                if (temp_username.toLowerCase().includes(needle.toLowerCase())){
                    temp_rows.push(convo_list[x]);
                }
            }
            chat_panels = temp_rows;
            createPanel(chat_panels);
        }
        else {
            chat_panels = convo_list.slice();
            createPanel(chat_panels);
        }
    });

    //create a new message button
    $("#new-message").click(function(e){
        changeConvo();
    })

    //enter to submit
    $("#msg_text_input").keypress(function(e){
        if (e.which == 13) {
            e.preventDefault();
            $("#messenger_form").submit();
        }
    });

    //submission of a new msg
    $("#messenger_form").submit(function(e){
        e.preventDefault();
        submit_data = checkSubmitFormat();

        if (can_submit && submit_data){
            can_submit = false;
            $.ajax({
    			type: "POST",
    			url: "/messages/new",
    			data: submit_data
    		}).done(function(data){
    			if (data.state == "success"){
                    var existing = false;
                    for (var x = 0; x < convo_list.length; x++){
                        if (convo_list[x].username.toLowerCase() == submit_data.msg_receiver.toLowerCase()){
                            existing = convo_list[x];
                            break;
                        }
                    }

                    //if its an existing convo, change to it
                    if (existing){
                        changeConvo(existing);
                    }

                    //append new message
                    $("#chat_wrapper").append(createConvoMsg({
                        message: submit_data.msg_text
                    }, false));
                    can_submit = true;
                    $("#msg_text_input").val("");
                    $('#chat_wrapper').scrollTop($('#chat_wrapper')[0].scrollHeight);
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
function checkSubmitFormat(){
    msg_receiver = $("#msg_receiver_input").val();
    msg_text = $("#msg_text_input").val();

    if (!msg_receiver){
        console.log("invalid person");
        //todo
    }
    else if (!msg_text){
        console.log("no message");
        //todo
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
function createPanel(chat_panels){
    $(".panel-list").empty();
    //side panel convo list
    for (var x = 0; x < chat_panels.length; x++){
        $(".panel-list").append(createPanelConvo(chat_panels[x]));
    }
}

//function to display a single chat convo on the left
function createPanelConvo(convo_item){
    var latest_time = moment(new Date(convo_item.timestamp + "Z"));
    disp_time = formatTimestamp(latest_time);

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
        }).done(function(chat_item){
            changeConvo(appendChatsToConvo(chat_item));
        });
    })

    return panel_block.append(panel_icon.append(panel_i), name, panel_p);
}

//function to append chat msgs to convo list
function appendChatsToConvo(chat_item){
    for (var x = 0; x < convo_list.length; x++){
        if (convo_list[x].username == chat_item.username){
            convo_list[x].chats = chat_item.chats;
            return convo_list[x];
        }
    }
}

//function to change selected convo
function changeConvo(convo_item){
    $("#chat_wrapper").empty();
    $("#msg_text_input").val("");

    //changing to an existing conversation
    if (convo_item){
        for (var x = 0; x < convo_item.chats.length; x++){
            $("#chat_wrapper").append(createConvoMsg(convo_item.chats[x], true));
        }
        $("#msg_receiver_input").val(convo_item.username).addClass("is-disabled");
        $('#chat_wrapper').scrollTop($('#chat_wrapper')[0].scrollHeight);
    }
    //changing to a totally new convo (create new msg)
    else {
        $("#msg_receiver_input").val("").removeClass("is-disabled");
    }
}

//function to create a single msg from a chat convo
function createConvoMsg(chat_item, bool){
    //came from server
    if (bool){
        var timestamp = moment(new Date(chat_item.timestamp + "Z")).format("M/DD, H:mma");
        var send_or_not = (chat_item.sender_account_id == user.id) ? "sender_me" : "sender_them";
    }
    //came from client
    else {
        var timestamp = moment(new Date()).format("M/DD, H:mma");
        var send_or_not = "sender_me";
    }

    var latest_time = (chat_item.timestamp) ? moment(new Date(chat_item.timestamp + "Z")) : moment(new Date());
    disp_time = formatTimestamp(latest_time);

    var temp_div = $("<div class='message_wrapper " + send_or_not + "'></div>");
        var temp_msg = $("<p class='chat_message'></p>");
            temp_msg.text(chat_item.message);
        var temp_timestamp = $("<p class='chat_timestamp'>" + disp_time + "</p>");

    //change append order depending on who sent the msg
    if (send_or_not == "sender_me"){
        temp_div.append(temp_timestamp, temp_msg);
    }
    else {
        temp_div.append(temp_msg, temp_timestamp);
    }

    return temp_div;
}

//helper function to format timestamp
function formatTimestamp(latest_time){
    var moment_now = moment(new Date());
    var diff_to_now = moment_now.diff(latest_time);
    var diff_to_lny = latest_time.diff(moment(new Date("01/01/" + (moment_now.year() - 1))));

    //less than a day
    if (diff_to_now < 86400000){
        return latest_time.format("h:mma");
    }
    //less than a week
    else if (diff_to_now < 604800000){
        return latest_time.format("ddd");
    }
    //less than last year
    else if (diff_to_now < diff_to_lny){
        return latest_time.format("MMM DD");
    }
    //greater than last year
    else {
        return latest_time.format("YYYY/MM/DD");
    }
}
