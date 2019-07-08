var API_KEY = 'api_key=d50148cbfe594e27a232c50d1c2933a9'
async function log_request(request, location, id) {
    return $.getJSON(request+"&"+API_KEY).then(function(x) {
        console.log(x)
        $( "body" ).data( "stop_name", JSON.stringify(x.data))
        console.log($(location).data(id))
        return x
    })
    /*.success(function() {
        console.log($(location).data(id))
        alert("finished")
    })*/
}
async function getStops(route) {
    return log_request()
}
function stop1button(){
    $("#stop1").data('stop_name', document.getElementById("stop1").value)
    console.log("Someone pressed the stop 1 button! " + $("#stop1").data('stop_name'))
}
function myFunction(){
    //first, user types in their first stop. [press enter to evaluate].

    // They also have a place to add the departure time. <-- for now we'll assume departure time is now
    //then, user either gets an error message or a drop down menu with available routes.
    // User retypes first stop or chooses a route.
    //then, user is presented with a menu of stops, with the current stop greyed out.
    // User selects a stop on the menu. They press a confirmation button.
    // Present data is: departure time, direction id, start stop (name and id),
    //      end stop (name and id), route (name and id)
    // Actually finding the trip:
    //  first:
    var stop1 = document.getElementById("stop1").value;
    var stop2 = document.getElementById("stop2").value;
    var route = document.getElementById("route1").value;
    Promise.all()

}
