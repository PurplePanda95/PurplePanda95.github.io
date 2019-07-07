function log_request(request, location, id) {
    $.getJSON(request+"&api_key=d50148cbfe594e27a232c50d1c2933a9")
    .always(function(data) {
        console.log(data)
        $(location).data( id, data)
    })
}

// returns the name of a stop, given the ID
function stop_name(stop_id){
    log_request("https://api-v3.mbta.com/stops/" + stop_id + "?", "body", "stop_name")
    name = $("body").data("stop_name")
    $("body").removeData("stop_name")
    return name //['data']['attributes']['name']
}
console.log("HI!!")
console.log(stop_name('2690'))
//var stopData = JSON.parse(JSON.stringify(data)).data