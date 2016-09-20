var can_submit = true;

$(document).ready(function() {


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

    			//reset the data to default value
    			$(".to-reset").val("");
    			can_submit = true;

    			if (data.state == "success"){
    				console.log("success")
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


//function to create all chat convos on the left
function createPanelConvos(){
    for (var x = 0; x < chat_history.length; x++){
        $(".panel-list").append(createPanelConvo(chat_history[x]));
    }
}

//function to display a single chat convo on the left
function createPanelConvo(convo_item){
    var latest_time = convo_item.timestamp;
    var panel_block = $("<a class='panel-block'></a>");
        var panel_icon = $("<span class='panel-icon'></span>");
            var panel_i = $("<i class='fa fa-user'></i>");
        var name = convo_item.receiver_name;
        var panel_p = $("<p class='is-pulled-right'>" + latest_time + "</p>")

    return panel_block.append(panel_icon.append(panel_i), name, panel_p);
}
