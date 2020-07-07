var API_KEY = 'api_key=d50148cbfe594e27a232c50d1c2933a9'

//https://api-v3.mbta.com/schedules/?filter[route]=87&sort=direction_id&sort=stop_sequence&api_key=d50148cbfe594e27a232c50d1c2933a9
//https://api-v3.mbta.com/schedules/?filter[route]=62&sort=stop_sequence&sort=direction_id&page[limit]=200&api_key=d50148cbfe594e27a232c50d1c2933a9
//then:
//https://api-v3.mbta.com/schedules/?filter[trip_id]=ALL_THE_TRIP_IDS&sort=direction_id&sort=stop_sequence&api_key=d50148cbfe594e27a232c50d1c2933a9
function route1button(){
    var route_id = document.getElementById("route1").value;
    $("#route1").data('route_id', route_id)
    console.log("Someone pressed the stop 1 button! " + route_id)
    trips = {}
    shapes = {}
    route = {}
    stops = {}
    a = $.getJSON("https://api-v3.mbta.com/route_patterns/?filter[route]=" + route_id +
    "&include=representative_trip,representative_trip.shape,route,representative_trip.shape.stops&fields[trip]"+
    "=headsign,direction_id&fields[stop]=name,latitude,longitude"+"&"+API_KEY).then(
        format_route_data
    ).then(
        makeDropDowns
    )


}
function makeDropDowns() {
    if (document.getElementById("stop_selector") !== null) {
        var element = document.getElementById("stop_selector");
        element.parentNode.removeChild(element);
    }
    big_node = document.createElement("DIV")
            big_node.id = "stop_selector"
            $("#stop_selector").data("selecting", "select_start")
            for (trip in trips) {
                this_trip = trips[trip]
                dropdown = document.createElement("DIV");
                dropdown.id = trip
                dropdown.setAttribute("class", "dropdown");
                content = document.createElement("DIV")
                content.id = trip + "content"
                content.setAttribute("class", "dropdown-content trip");
                button = document.createElement("BUTTON")
                button.id = trip + "button"
                button.setAttribute("class", "dropbtn")
                button.setAttribute("onClick", "tripbutton('" + trip + "content')")//;updatesvg('" + this_trip.shape.polyline + "')")
                button.innerText = this_trip.route_pattern.name
                for (stop of this_trip.stops) {
                    //console.log(stop)
                    item = document.createElement("BUTTON")
                    item.setAttribute("class", "stop " + stop.id);
                    item.id = (trip + "XX" + stop.id)
                    text_node = document.createTextNode(stop.name)
                    item.appendChild(text_node)
                    item.setAttribute("onClick", "stop_button('" + stop.id + "')")
                    content.appendChild(item)
                }
                //console.log(document.getElementById(content.id).value)
                dropdown.appendChild(button)
                dropdown.appendChild(content)
                //console.log(document.getElementById(trip + "content"))
                big_node.appendChild(dropdown);
            }
            document.body.appendChild(big_node)
            //console.log
}
function update_trips(thing) {
    trip_id = thing.id
    trips[trip_id].direction_id = thing.attributes.direction_id
    trips[trip_id].headsign = thing.attributes.headsign
    shape_id = thing.relationships.shape.data.id
    if (!(shapes.hasOwnProperty(shape_id))) {
        shapes[shape_id] = {trip_id: thing.id}
    }
    else {
        trips[trip_id].shape = shapes[shape_id].shape;
        trips[trip_id].stops = shapes[shape_id].stops;
    }
}
function update_shapes(thing) {
    shape_id = thing.id
    if (shapes.hasOwnProperty(shape_id)) {
        trip_id = shapes[shape_id].trip_id
        trips[trip_id].shape = thing.attributes;
        trips[trip_id].stops = thing.relationships.stops.data            }
    else {
        shapes[shape_id] = {shape: thing.attributes, stops: thing.relationships.stops.data}
    }
}
function update_stops(trip) {
    trip_stops = trip.stops.map(function(stop) {return {id: stop.id, name: stops[stop.id].name,
        latitude: stops[stop.id].latitude, longitude: stops[stop.id].longitude}})
    trip.stops = trip_stops
}
function format_route_data(x) {
    //console.log(x)
    for (pattern of x.data) {
        //console.log(pattern.relationships)
        trip_id = pattern.relationships.representative_trip.data.id;
        trips[trip_id] = {route_pattern: pattern.attributes}
        trips[trip_id].route_pattern.id = pattern.id
    }
    for (thing of x.included) {
        if (thing.type == "trip") {
            update_trips(thing)
            continue
        }
        if (thing.type == "shape") {
            update_shapes(thing)
            continue
        }
        if (thing.type == "route") {
            route = thing.attributes
            continue
        }

        stop_id = thing.id
        stops[stop_id] = thing.attributes
    }
    for (trip in trips) {
        update_stops(trips[trip])
    }
    console.log(trips)
    $("body").data("trips", trips)
    $("body").data("route", route)
    //console.log(route)
}
function stopsbutton() {
  document.getElementById("myDropdown").classList.toggle("show");

}
function tripbutton(id) {
    document.getElementById(id).classList.toggle("show");
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show') && openDropdown.id != id) {
        openDropdown.classList.remove('show');
      }
    }
}
function stop_button(id) {
    var y = document.getElementsByClassName("trip");
    var selecting = $("#stop_selector").data("selecting")
    for (let i = 0; i < y.length; i ++) {
        var greying = true;
        if (selecting === "select_end") {
            greying = false
        }
        console.log("pathetic")
        for (let j = 0; j < y[i].children.length; j ++) {

            var openStop = y[i].children[j];
            console.log(openStop)
            if (openStop.classList.contains(id)) {
                console.log("hoho")
                if (selecting === "select_start" && !(openStop.classList.contains("select_end") || openStop.classList.contains("select_start"))) {
                    openStop.classList.add("select_start")
                    selecting = "select_end"
                    greying = false
                }
                else if (!(openStop.classList.contains("select_start") || openStop.classList.contains("greyed")) && selecting === "select_end") {
                    openStop.classList.add("select_end")
                    selecting = "done"
                    greying = true
                }
                else if (openStop.classList.contains("select_start") && (selecting === "done" || selecting === "select_end")) {
                    openStop.classList.remove("select_start")
                    selecting = "select_start"
                    greying = false
                }
                else if (openStop.classList.contains("select_end") && (selecting === "done")) {
                    openStop.classList.remove("select_end")
                    selecting = "select_end"
                    greying = false
                }
                continue
            }
            if (greying) {
                console.log("huzzah")
                openStop.classList.add("greyed")
            } else {
                openStop.classList.remove("greyed")
            }

            //else if (openStop.classList.contains('select_end'))
        }
    }
    $("#stop_selector").data("selecting", selecting)
    //getPrediction(id, "place-lech").then(
    //function(x) {console.log(x)})
}
scale = 7000
function updatesvg(polylin) {
    scaled_points = polyline.decode(polylin, 5).map(x => [x[0]*scale - 42.35*scale, x[1]*scale+71.14*scale])
    updated_polyline = JSON.stringify(scaled_points).split("],[").join(" ").slice(2,-2)
    console.log(updated_polyline)
    document.getElementById("map").setAttribute("points", updated_polyline)
    console.log(document.getElementById("map"))
}
function getPrediction(stop1_name, stop2_name, route_id, time) {
    //var route_id = document.getElementById("route1").value;
    //$("#route1").data('route_id', route_id)
    //console.log("Someone pressed the stop 1 button! " + route_id)
    trips = {}
    shapes = {}
    route = {}
    stops = {}
    var stop1_id;
    var stop2_id;
    var trip_found = false
    var ids = [];
    return $.getJSON("https://api-v3.mbta.com/route_patterns/?filter[route]=" + route_id +
    "&include=representative_trip,representative_trip.shape,route,representative_trip.shape.stops&fields[trip]"+
    "=headsign,direction_id&fields[stop]=name,latitude,longitude"+"&"+API_KEY).then(
        format_route_data
    ).then( function() {

    for (x in trips) {
        trip = trips[x]
        for (y in trip.stops) {
            if (trip.stops[y].name == stop1_name) {
                stop1_id = trip.stops[y].id
                trip_found = true
            }
            else if (trip_found && trip.stops[y].name === stop2_name) {
                stop2_id = trip.stops[y].id
                ids.push(trip.route_pattern.id)
                trip_found = false
                break
            }
        }
    }
    console.log(stop1_id)
    console.log(stop2_id)
    console.log(ids.length + "wow")
    if (ids.length == 0 ) {m}
    }).then(function() {
     return $.getJSON("https://api-v3.mbta.com/trips/?filter[route_pattern]=" + ids.join() +
        "&fields[trip]=&"+API_KEY)}).then(
        function(x) {
            trip_ids = x.data.map(function(trip) {return trip.id})
            console.log("https://api-v3.mbta.com/predictions/?filter[trip]=" + trip_ids.join() +
        "&sort=time&filter[stop]=" + stop1_id + "," + stop2_id + "&" +API_KEY)
            return $.getJSON("https://api-v3.mbta.com/predictions/?filter[trip]=" + trip_ids.join() +
        "&sort=time&filter[stop]=" + stop1_id + "," + stop2_id + "&" +API_KEY)
        }

    ).then(
        function(x) {
            console.log("huh")
            console.log(x + "what")
            var found = false
            var take_trip = {}
            for (prediction of x.data){
                if (getTime(prediction.attributes) > time && prediction.relationships.stop.data.id === stop1_id) {
                    found = true
                    take_trip.prediction1 = prediction
                    take_trip.found = false
                    console.log("hi")
                }
                else if (found && prediction.relationships.stop.data.id !== stop1_id
                    && prediction.relationships.trip.data.id === take_trip.prediction1.relationships.trip.data.id) {
                    take_trip.found = true
                    take_trip.prediction2 = prediction
                    break
                }
            }
            if (take_trip.found) {
                console.log("yay")
                returner = {
                    departure_time: getTime(take_trip.prediction1.attributes),
                    arrival_time: getTime(take_trip.prediction2.attributes),
                    start: stop1_id,
                    end: stop2_id,
                    route: take_trip.prediction1.relationships.route.data.id
                }
                console.log(returner)
                return returner
            }
            else {
            console.log("sorry")
                return "no"
            }
        }
    ).then(function(x) {console.log(x)
    console.log("big whoop")
        return x
    })

}
function milli(minutes) {
    return minutes * 60000

}
function getTime(attributes) {
    if (attributes.arrival_time !== null) {
        return Date.parse(attributes.arrival_time)
    }
    if (attributes.departure_time !== null) {
        return Date.parse(attributes.departure_time)
    }
    return null
}
function route_school() {
    route87 = getPrediction("McGrath Hwy @ Medford St", "Lechmere", "87", Date.now() + milli(3))
    //route80 = getPrediction("McGrath Hwy @ Medford St", "Lechmere", "80", Date.now() + milli(7))
    //route88 = getPrediction("McGrath Hwy @ Medford St", "Lechmere", "88", Date.now() + milli(7))
    //route91 = getPrediction("Somerville Ave @ Stone Ave", "Prospect St @ Bishop Allen Dr", "91", Date.now() + milli(3))
    //routeCT2 = getPrediction("Somerville Ave @ Stone Ave", "Ames St @ Main St", "747", Date.now() + milli(3))
    //route86 = getPrediction("Somerville Ave @ Stone Ave", "Harvard Sq @ Garden St - Dawes Island", "86", Date.now() + milli(3))
    /*green = Promise.all(route87, route80, route88).then(

        function(trips) {
            var best_trip = trips[0]
            for (trip of trips) {
                if (trip != null && (best_trip == null || trip.arrival_time < best_trip.arrival_time)) {
                    best_trip = trip
                }
            }
            return best_trip
        }
    )
    Promise.all(green, route86, route91, routeCT2).then(
        function(trips) {
            console.log(trips)
        }
    )*/
    getPrediction("McGrath Hwy @ Medford St", "Lechmere", "88", Date.now()).then(
        function(trips) {
            console.log(trips)
            return getPrediction("Lechmere", "Copley", "Green-E", trips.arrival_time)
            //.then(
            //function(x) {console.log(x)}
            //)
        }
    ).then(function(x) {console.log(x)})
}
function openWebsite() {
    $.get("https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getDate",
    function(data) {
        console.log(data)
    })


}
/**function myFunction(){
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

}**/

// Close the dropdown if the user clicks outside of it
/*window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}
*/