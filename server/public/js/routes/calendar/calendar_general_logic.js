$(document).ready(function() {
    setUpCalendar();
});

//function to setup the calendar
function setUpCalendar(){
    //calendar styling
    $(".button").click(function(e){
        id = $(this).attr("id");
        $(".fc-" + id).click();
    });

    //custom buttons
    $(".fc-today-button").hide();
    $("#remove_events").click(function(e){
        $('#calendar').fullCalendar('removeEvents', filterMine);
    });

    //change to month view
    $("#month_button").click(function(e){
        var view = $('#calendar').fullCalendar('getView');

        if (view.name == "agendaWeek"){
            $("#calendar").fullCalendar( 'changeView', "month");
            $(this).text("Week View");
        }
        else {
            $("#calendar").fullCalendar( 'changeView', "agendaWeek");
            $(this).text("Month View");
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
