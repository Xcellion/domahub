var inbox_global_obj = {
    can_submit: true,
    more_msgs: true,
    current_target: false
}
var chat_panels = convo_list.slice();

//function that runs when back button is pressed
window.onpopstate = function(event) {
    //username in URL
    if (window.location.pathname.split("/").length == 4){
        changeConvo(window.location.pathname.split("/").pop(), true);
    }
    else {
        changeConvo(null, true);
    }
}

$(document).ready(function() {

    createPanel(chat_panels);     //create the convo list panel on the left
    if (convo_list.length > 0){

        //username in URL
        if (window.location.pathname.split("/").length == 4){
            changeConvo(window.location.pathname.split("/").pop(), true);
        }
        else {
            history.replaceState(null, "Domahub - " + convo_list[0].username, "/profile/inbox/" + convo_list[0].username);
            changeConvo(convo_list[0].username, true);
        }
    }

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

    //to remove the error message if it exists
    $("#msg_receiver_input").keypress(function(e){
        if ($("#inbox-message").text() != ""){
            $("#inbox-message").text("");
        }
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
            $("#msg_text_input").val("");   //empty the current typed msg

            inbox_global_obj.can_submit = false;
            changeConvo(submit_data.msg_receiver);
            newMsgChatBubble(submit_data.msg_text, submit_data.msg_receiver);
            submitMessage(submit_data);
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
        $("#inbox-message").text("Please enter a username to send the message to!");
    }
    else if (!$.trim(msg_text)){
        //no message, prevent sending
    }
    else {
        return {
            msg_receiver: msg_receiver,
            msg_text: msg_text
        };
    }

    return false;
}

//AJAX to submit new message to server
function submitMessage(submit_data){
    $.ajax({
        type: "POST",
        url: "/messages/new",
        data: submit_data
    }).done(function(data){
        inbox_global_obj.can_submit = true;
        var latest = $($(".message_wrapper")[$(".message_wrapper").length - 1]);
        latest.find("#resend-icon").remove();

        if (data.state == "success"){
            latest.find(".chat_message").removeClass("is-disabled");
            chat_panels = data.convo_list;
            convo_list = data.convo_list;
            createPanel(chat_panels);
        }
        //if errored show the resend button
        else if (data.state == "error"){
            latest.find(".chat_message").addClass("is-disabled");
            var resend_icon = $("<i id='resend-icon' class='fa fa-repeat'></i>");

            resend_icon.click(function(e){
                submitMessage({
                    msg_receiver: submit_data.msg_receiver,
                    msg_text: latest.find(".chat_message").text()
                });
            })

            latest.prepend(resend_icon);

            if (data.message){
                $("#inbox-message").text(data.message);
                $("#msg_receiver_input").removeClass("is-disabled").val("").focus();
                $("#chat_wrapper").find("*").not("#convo-loading").remove();
                $("#new-message-controls").addClass("is-hidden");
            }
        }
        else {
            console.log(data);
        }
    });
}

//get the chat_panels item of the current msg target
function setChatPanel(username, new_text){
    var panel_exists = false;
    for (var x = 0; x < chat_panels.length; x++){
        if (chat_panels[x].username.toLowerCase() == username.toLowerCase()){
            chat_panels[x].message = new_text;
            chat_panels[x].timestamp = false;
            var readd = chat_panels.splice(x, 1);
            panel_exists = true;
            break;
        }
    }

    if (panel_exists){
        var temp_array = [];
        temp_array.push.apply(temp_array, readd);
        temp_array.push.apply(temp_array, chat_panels);
        chat_panels = temp_array;
    }
    else {
        chat_panels.unshift({
            message: new_text,
            seen: 0,
            timestamp: false,
            username: username
        })
    }
    createPanel(chat_panels);
}

//function to append a new chat msg
function newMsgChatBubble(new_text, username){
    inbox_global_obj.can_submit = true;

    var prev_latest = $($(".message_wrapper")[$(".message_wrapper").length - 1]);
    var new_latest = createConvoMsg({
        message: new_text
    }, false)

    if (prev_latest){
        if ((prev_latest.hasClass("sender_me") && new_latest.hasClass("sender_me")) || (prev_latest.hasClass("sender_them") && new_latest.hasClass("sender_them"))){
            if (prev_latest.hasClass("message_bottom") || prev_latest.hasClass("message_middle")){
                new_latest.addClass("message_bottom");
                prev_latest.removeClass("message_bottom").addClass("message_middle");
            }
            else {
                prev_latest.addClass("message_top");
                new_latest.addClass("message_bottom");
            }
        }
        else {
            if (prev_latest.hasClass("message_bottom") || prev_latest.hasClass("message_middle")){
                prev_latest.removeClass("message_middle").addClass("message_bottom");
            }
        }
    }

    setChatPanel(username, new_text);

    $("#msg_text_input").val("");   //empty the current typed msg
    $("#chat_wrapper").append(new_latest);
    $('#chat_wrapper').scrollTop($('#chat_wrapper')[0].scrollHeight);   //scroll to bottom
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
    if (!convo_item.timestamp){
        var latest_time = moment(new Date());
    }
    else {
        var latest_time = moment(new Date(convo_item.timestamp + "Z"));
    }
    disp_time = formatTimestamp(latest_time);
    disp_msg = (convo_item.message.length > 30) ? convo_item.message.substr(0,30) + "..." : convo_item.message;

    var panel_block = $("<a class='panel-block'></a>");
    panel_block.data("username", convo_item.username.toLowerCase());
    if (inbox_global_obj.current_target){
        if (inbox_global_obj.current_target.toLowerCase() == convo_item.username.toLowerCase()){
            panel_block.addClass("is-active");
        }
    }

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
function changeConvo(username, history_bool){
    //if trying to message yourself
    if (username && (username.toLowerCase() == user.username.toLowerCase())){
        history.replaceState(null, "", "/profile/inbox");
    }

    if (!username || username.toLowerCase() == user.username.toLowerCase()){
        $("#msg_text_input").val("");   //empty the current typed msg
        $(".panel-block").removeClass('is-active');     //remove all selected left panel green
        $("#chat_wrapper").find("*").not("#convo-loading").remove();

        $("#msg_receiver_input").focus();       //focus the username field
        $("#new-message-controls").addClass("is-hidden");       //hide new msg controls
        $("#msg_receiver_input").val("").removeClass("is-disabled");
        inbox_global_obj.current_target = false;
    }
    else if (username.toLowerCase() != inbox_global_obj.current_target){
        $("#msg_text_input").val("");   //empty the current typed msg
        $(".panel-block").removeClass('is-active');     //remove all selected left panel green
        $("#convo-loading").removeClass("is-hidden");
        $("#chat_wrapper").find("*").not("#convo-loading").remove();

        $("#msg_text_input").focus();       //focus the message textarea
        $("#new-message-controls").removeClass("is-hidden");    //show new msg controls
        $("#msg_receiver_input").val(username).addClass("is-disabled");
        inbox_global_obj.current_target = username.toLowerCase();

        //add active to correct side panel
        $(".panel-block").each(function(e){
            if ($(this).data("username") == username.toLowerCase()){
                $(this).addClass("is-active");
                return false;
            }
        });

        if (!history_bool){
            history.pushState(null, "Domahub - " + username, "/profile/inbox/" + username);
        }

        getConvoItem(username, function(convo_item){
            if (convo_item){
                appendChats(convo_item.chats);
                $("#convo-loading").addClass("is-hidden");
            }

            if (!username){
                $("#convo-loading").addClass("is-hidden");
            }
        });
    }
}

//function to append chats to screen
function appendChats(chats){
    var prev_height = $('#chat_wrapper')[0].scrollHeight;

    //create the chats
    var prev_chat = $($(".message_wrapper")[0]);
    for (var x = 0; x < chats.length; x++){
        var temp_chat = createConvoMsg(chats[x], true);
        if (prev_chat){
            if ((prev_chat.hasClass("sender_me") && temp_chat.hasClass("sender_me")) || (prev_chat.hasClass("sender_them") && temp_chat.hasClass("sender_them"))){
                if (prev_chat.hasClass("message_bottom") || prev_chat.hasClass("message_middle")){
                    temp_chat.addClass("message_middle");
                }
                else {
                    prev_chat.removeClass("message_top").addClass("message_middle");
                }
            }
            else {
                if (!prev_chat.hasClass("message_bottom")){
                    prev_chat.addClass("message_top");
                }
                else {
                    prev_chat.removeClass("message_bottom")
                }
                prev_chat.removeClass("message_middle");
                temp_chat.addClass("message_bottom");
            }
        }
        else {
            temp_chat.addClass("message_bottom");
        }
        prev_chat = temp_chat;
        $("#chat_wrapper").prepend(temp_chat);
    }
    if (!prev_chat.hasClass("message_bottom")){
        prev_chat.addClass("message_top").removeClass("message_middle");
    }
    else {
        prev_chat.removeClass("message_bottom").removeClass("message_middle");
    }

    //load more messages button
    if (chats.length % 20 == 0 && chats.length != 0){
        var load_more_div = $("<div id='load-more' class='has-text-centered'></div>")
            var load_more_button = $("<a class='button no-shadow load-more'></a>");
                var load_more_icon = $("<span class='icon'></span>");
                    var load_more_i = $("<i class='fa fa-angle-up'></i>");
                var load_more_text = $("<span>Load More...</span>");
        load_more_div.append(load_more_button.append(load_more_icon.append(load_more_i), load_more_text));
        $("#chat_wrapper").prepend(load_more_div);

        //click handler for loading more messages when scrolled to the top
        load_more_button.click(function(e){
            load_more_i.addClass("is-hidden");
            load_more_button.addClass('is-loading');
            getConvoItem(inbox_global_obj.current_target, function(convo_item){
                getMsgsAjax(convo_item, function(chat_item){
                    $("#load-more").remove();
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

    //hover over time to get the exact time
    temp_msg.hover(function(e){
        temp_timestamp.text(moment(latest_time).format("YYYY/MM/DD h:mma"));
    }, function(e){
        temp_timestamp.text(formatTimestamp(latest_time));
    })

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

    //doesnt exist in left panel, new convo!
    cb(false);
}

//function to AJAX call for more msgs and appends them to the convo_item
function getMsgsAjax(convo_item, cb){
    if (inbox_global_obj.more_msgs){
        inbox_global_obj.more_msgs = false;
        length = (convo_item.chats) ? convo_item.chats.length : 0;

        $.ajax({
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
