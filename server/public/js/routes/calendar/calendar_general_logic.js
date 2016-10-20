$(document).ready(function() {
    setUpCalendar();
});

//function to setup the calendar
function setUpCalendar(){
    //calendar styling
    $(".fc-button").hide();
    $(".button").click(function(e){
        id = $(this).attr("id");
        $(".fc-" + id).click();
    });
    $(".fc-toolbar").prependTo("#calendar_left_wrapper");
    $('#calendar').fullCalendar('option', 'height', $("#calendar_wrapper").height() - $("#calendar_top_wrapper").height() - $("#navbar").height());

    $("#remove_events").click(function(e){
        $('#calendar').fullCalendar('removeEvents', filterMine);
    });

    $("#month_button").click(function(e){
        var view = $('#calendar').fullCalendar('getView');

        if (view.name == "agendaWeek"){
            $("#calendar").fullCalendar( 'changeView', "month");
            $(this).text("Week");
        }
        else {
            $("#calendar").fullCalendar( 'changeView', "agendaWeek");
            $(this).text("Month");
        }
    });
}

//helper function to check if date X overlaps any part with date Y
function checkOverlap(dateX, durationX, dateY, durationY){
	return (dateX.getTime() < dateY.getTime() + durationY) && (dateY.getTime() < dateX.getTime() + durationX);
}

//helper function to check if date X is fully covered by date Y
function checkFullOverlap(dateX, durationX, dateY, durationY){
	return (dateY.getTime() <= dateX.getTime()) && (dateX.getTime() + durationX <= dateY.getTime() + durationY);
}

//helper function to filter out events that aren't mine
function filterMine(event) {
    return !event.hasOwnProperty("old") && event.rendering != 'background';
}

//helper function to find all newly added time
function filterNew(event){
	return event.newevent;
}

//helper function to filter out existing rental for editing
function filterSame(event, id){
	return event.rental_id == id;
}
