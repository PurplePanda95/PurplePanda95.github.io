window.onLoad = function() {
    createNewRouteSelect("01")
}
function setPoint(id) {
    var type = id.slice(0,-4);
    document.getElementById(id).classList.remove("show")
    document.getElementById("i" + id).classList.add("show")
    if (type == "stop") {
        makeStopDrop(id.slice(-4))
    }
    else {
        makeRouteDrop(id.slice(-4))
    }

    //hide the button
    //insert an input
    //insert/show a dropdown <-- if possible
    //if user types ENTER:
    //hide dropdown and input, add button, set button content to the input
}
function createNewRouteSelect(num) {
    var here = document.getElementById("route-blocks")

    //set up container div
    route = addElem("DIV", "rb" + num, "route-block")

    //create and append first drop-div
    var drop_div = addElem("DIV", "dstop" + num + "01", "dropdown")
    var button = addBtn("stop" + num + "01", "type-drop stop show", "setPoint(stop" + num + "01)")
    drop_div.appendChild(button)
    var input = addElem("INPUT", "istop" + num + "01", "input-bit")
    drop_div.appendChild(input)
    var dropContent = addElem("DIV", "stopcontent" + num + "01", "drop-content")
    drop_div.append(dropContent)
    route.appendChild(drop_div)

    drop_div = addElem("DIV", "droute" + num + "01", "dropdown")
    button = addBtn("route" + num + "01", "type-drop route show", "setPoint(route" + num + "01)")
    drop_div.appendChild(button)
    input = addElem("INPUT", "iroute" + num + "01", "input-bit")
    drop_div.appendChild(input)
    dropContent = addElem("DIV", "routecontent" + num + "01", "drop-content")
    drop_div.append(dropContent)
    route.appendChild(drop_div)

    drop_div = addElem("DIV", "dstop" + num + "02", "dropdown")
    button = addBtn("stop" + num + "02", "type-drop stop show", "setPoint(stop" + num + "02)")
    drop_div.appendChild(button)
    input = addElem("INPUT", "istop" + num + "02", "input-bit")
    drop_div.appendChild(input)
    dropContent = addElem("DIV", "stopcontent" + num + "02", "drop-content")
    drop_div.append(dropContent)
    route.appendChild(drop_div)

    var plus_button = addBtn("plus" + num, "add-stop", "addStop(" + num + ")")
    route.appendChild(plus_button)
    here.appendChild(route)

}
function addBtn(id, class, onClick) {
    var button = document.createElement("BUTTON")
    button.id = id
    button.setAttribute("class", class)
    button.setAttribute("onClick", onClick)
    return button
}
function addElem(type, id, class) {
    var thing = document.createElement(type)
    thing.id = id
    thing.setAttribute("class", class)
    return thing
}
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
/*<button class="type-drop stop show" id="stop0101" onclick="setPoint(stop0101)">Stop</button>
            <div class="drop-input" id="dstop0101">
                <input type="text" class="input-bit" id="istop0101" value="">
            </div>
            <button class="type-drop route show" id="route0101" onclick="setPoint(route0101)">Route</button>
            <input type="text" class="input-bit" id="iroute0101" value="">
            <button class="type-drop stop show" id="stop0102" onclick="setPoint(stop0102)">Stop</button>
            <input type="text" class="input-bit" id="istop0102" value="">
            <button class="add-stop">+</button>*/