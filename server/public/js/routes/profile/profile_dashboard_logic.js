$(document).ready(function() {
    createListingGraph(listings_search);
    createRentalRows(rentals);

    var chart_dataset = [];
    var monthly_labels = [];
    //random green-ish color
    var temp_colors = randomColor({
        hue: 'green',
        luminosity: 'dark',
        count: listings_search.length
    });

    //loop through all listings to create the dataset
    for (var x = 0; x < listings_search.length; x++){
        while (listings_search[x].count.length < 6){
            listings_search[x].count.unshift(0);
        }
        chart_dataset.push({
            borderColor: temp_colors[x],
            backgroundColor: temp_colors[x],
            fill: false,
            label: listings_search[x].domain_name,
            data: listings_search[x].count
        });
    }

    //create the labels array
    for (var y = 0; y < 6; y++){
        var temp_month = moment(new Date() - (2592000000 * (y+1))).format("MMM");
        monthly_labels.unshift(temp_month);
    }

    //create the chart
    var myChart = new Chart($("#myChart")[0], {
        type: 'line',
        data: {
            labels: monthly_labels,
            datasets: chart_dataset
        },
        options: {
            responsive: true,
            //tooltip to display all values at a specific X-axis
            tooltips: {
                mode: 'x-axis',
                callbacks: {
                    label: function(tooltipItems, data) {
                        return " " + tooltipItems.yLabel + ' Views';
                    }
                }
            },
            scales: {
                yAxes: [{
                    display: true,
                    ticks: {
                        suggestedMax: 100,
                        beginAtZero: true   // minimum value will be 0.
                    }
                }]
            }
         }
    });
});

//create all listing rows
function createListingGraph(listings_search){

}

//create all rental rows
function createRentalRows(rentals){
    if (rentals && rentals.length > 0){
        for (var x = 0; x < rentals.length; x++){
            var tr = $("<tr></tr");
            tr.append("<td><a href='/listing/" + rentals[x].domain_name + "/" + rentals[x].rental_id + "'>" + rentals[x].domain_name + "</a></td>");
            var active = (rentals[x].active == 1) ? "Active" : "Inactive";
            tr.append("<td>" + active + "</td>");
            $("#rental_table").append(tr);
        }
    }
    else {
        var tr = $("<tr></tr");
        tr.append("<td colspan='2'>You currently have no rentals!</td>");
        $("#rental_table").append(tr);
    }
}
