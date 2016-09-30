var inbox_global_obj = {
    can_submit: true,
    more_msgs: true,
    current_target: false
}
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
        $(".panel-block").removeClass('is-active');
        changeConvo();
    })

    //enter to submit, shift-enter for new line
    $("#msg_text_input").keypress(function(e){
        if (e.which == 13 && !event.shiftKey && $("#enter-checkbox")[0].checked){
            e.preventDefault();
            $("#messenger_form").submit();
        }
    });

    //submission of a new msg
    $("#messenger_form").submit(function(e){
        e.preventDefault();
        var submit_data = checkSubmitFormat();

        if (inbox_global_obj.can_submit && submit_data){
            inbox_global_obj.can_submit = false;
            $.ajax({
    			type: "POST",
    			url: "/messages/new",
    			data: submit_data
    		}).done(function(data){
    			if (data.state == "success"){
                    //change convo to existing if it exists, otherwise change to blank
                    changeConvo(submit_data.msg_receiver);

                    //append the new message
                    $("#chat_wrapper").append(createConvoMsg({
                        message: submit_data.msg_text
                    }, false));
                    inbox_global_obj.can_submit = true;
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
    disp_msg = (convo_item.message.length > 30) ? convo_item.message.substr(0,30) + "..." : convo_item.message;

    var panel_block = $("<a class='panel-block'></a>");
    panel_block.attr("id", "panel-" + convo_item.username.toLowerCase());

        var panel_icon = $("<span class='panel-icon'></span>");
            var panel_i = $("<i class='fa fa-user'></i>");
        var name = (convo_item.username.length > 20) ? convo_item.username.substr(0, 20) + "..." : convo_item.username;
        var panel_p = $("<p class='is-pulled-right is-light'>" + disp_time + "</p>");
        var panel_msg = $("<p class='panel-msg is-light'>" + disp_msg + "</p>");

    //to change the convo by clicking the panel of convos on the left
    panel_block.click(function(e){
        changeConvo(convo_item.username);
    })

    return panel_block.append(panel_icon.append(panel_i), name, panel_p, panel_msg);
}

//function to change selected convo
function changeConvo(username){
    if (!username){
        $("#chat_wrapper").empty();
        $("#msg_text_input").val("");   //empty the current typed msg
        $("#new-message-controls").addClass("is-hidden");       //hide new msg controls
        inbox_global_obj.current_target = false;
        $("#msg_receiver_input").val("").removeClass("is-disabled");
    }
    else if (username != inbox_global_obj.current_target){
        username = username.toLowerCase();

        $("#chat_wrapper").empty();
        $("#msg_text_input").val("");   //empty the current typed msg
        $("#new-message-controls").removeClass("is-hidden");    //show new msg controls
        inbox_global_obj.current_target = username;
        $("#msg_receiver_input").val(username).addClass("is-disabled");

        $(".panel-block").removeClass('is-active');
        $("#panel-" + username).addClass("is-active");
        getConvoItem(username, function(convo_item){
            appendChats(convo_item.chats);
        });
    }
}

//function to append chats to screen
function appendChats(chats){
    var prev_height = $('#chat_wrapper')[0].scrollHeight;

    //create the chats
    var prev_chat;
    for (var x = 0; x < chats.length; x++){
        var temp_chat = createConvoMsg(chats[x], true);
        if (!prev_chat){
            prev_chat = temp_chat;
            temp_chat.addClass("message_bottom");
        }
        //same person talking still
        else {
            if (x == chats.length - 1){
                temp_chat.addClass("message_bottom");
            }
            else if ((prev_chat.hasClass("sender_me") && temp_chat.hasClass("sender_me")) || (prev_chat.hasClass("sender_them") && temp_chat.hasClass("sender_them"))){
                temp_chat.addClass("message_middle");
            }
            else {
                prev_chat.removeClass("message_middle").addClass("message_bottom");
                temp_chat.addClass("message_top");
            }
            prev_chat = temp_chat;
        }
        $("#chat_wrapper").prepend(temp_chat);
    }

    //load more messages button
    if (chats.length % 20 == 0){
        var load_more = $("<a id='load-more' class='button no-shadow load-more'>Load More...</a>");
        $("#chat_wrapper").prepend(load_more);

        //click handler for loading more messages when scrolled to the top
        load_more.click(function(e){
            $(this).addClass('is-loading');
            getConvoItem(inbox_global_obj.current_target, function(convo_item){
                getMsgsAjax(convo_item, function(chat_item){
                    $(".load-more").remove();
                    appendChats(chat_item.chats);
                });
            });
        })
    }

    //scroll back to where we were before adding to the convo
    var cur_height =  $('#chat_wrapper')[0].scrollHeight;
    $('#chat_wrapper').scrollTop(cur_height - prev_height);
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
    disp_message = chat_item.message.replace(/(?:\r\n|\r|\n)/g, '<br />');

    var temp_div = $("<div class='message_wrapper " + send_or_not + "'></div>");
        var temp_msg = $("<p class='chat_message'></p>");
            temp_msg.html(disp_message);
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

//--------------------------------------------------------------------------------FUNCTIONS

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

//helper function to return the convo_list item with the given username
function getConvoItem(username, cb){
    for (var x = 0; x < convo_list.length; x++){
        if (convo_list[x].username.toLowerCase() == username.toLowerCase()){
            //get chats if it doesnt exist;
            if (!convo_list[x].chats){
                getMsgsAjax(convo_list[x], function(data){
                    convo_list[x].chats = data.chats;
                    cb(convo_list[x]);
                });
                break;
            }
            else {
                cb(convo_list[x]);
                break;
            }
        }
    }
}

//function to AJAX call for more msgs and appends them to the convo_item
function getMsgsAjax(convo_item, cb){
    if (inbox_global_obj.more_msgs){
        inbox_global_obj.more_msgs = false;
        length = (convo_item.chats) ? convo_item.chats.length : 0;

        $.ajax({
            async: false,
            type: "POST",
            url: "/messages/" + convo_item.username,
            data: {
                length: length
            },
            success: function(data){
                inbox_global_obj.more_msgs = true;
                appendChatsToConvoObj(convo_item, data)
                cb(data);
            }
        })
    }
}

//function to add chat msgs to convo object
function appendChatsToConvoObj(convo_item, chat_item){
    var temp_array = [];
    temp_array.push.apply(temp_array, convo_item.chats);
    temp_array.push.apply(temp_array, chat_item.chats);
    convo_item.chats = temp_array;
}
