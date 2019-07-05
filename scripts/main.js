function get_json_content(request) {
    var content
    content = $.get(request+"&api_key=d50148cbfe594e27a232c50d1c2933a9", function() {
        alert("success")
    })
    .done(function() {
        content = content.responseJSON
        alert("2nd success")
    })
    .fail(function() {
        alert( "error" );
        })
    .always(function() {
        alert( "finished" );
    });
    // If the response was successful, no Exception will be throwd
    return content
    
}


// returns the name of a stop, given the ID
function stop_name(stop_id){
    stops_info = get_json_content("https://api-v3.mbta.com/stops/%s" % stop_id)
    return stops_info['data']['attributes']['name']
}
// returns the stop ID, if the route and stop name combination is valid
function stop_info(route, name){
    data = get_json_content("https://api-v3.mbta.com/stops?filter[route]=%s&fields[stop]=name" % route)
    if (data['data'].length == 0) {
        throw KeyError("%s does not exist" % route)
    }
    for (stop in data['data']) {
        if (str(stop['attributes']['name']).upper() == name.upper()){
            return stop['id']
        }
    }
    err_string = "%s on %s does not exist" % (name, route)
    throw KeyError(err_string)
}

// Both "pretty_time" functions return nice, user readable times
function pretty_time(time_stamp) {
    if (time_stamp == 0){
        throw ValueError
    }
    else {
        d = new Date(time_stamp)
        minute = d.getMinutes()
        hour = d.getHour()
        if (hour > 12) {
            return str(hour - 12) + ":" + minute + "pm"
        }
        if (hour == 0) {
            return "12:" + minute + "am"
        }
        return str(hour) + ":" + minute + "am"
    }
}

function pretty_time_str(time_string) {
    pretty_time(get_time_stamp(time_string))
}

// self explanatory function takes the MBTA time string and converts it to a timestamp
function get_time_stamp(time_string) {
    return date.parse(time_string)
}

// Used to calculate the next vehicle with these properties arriving at that stop. Returns a tuple with arrival time,
// direction_id, trip_id, a user-friendly name for the route + direction combo, and the stop_sequence. A lot of this
// information was initially for debugging
function start_arrival(stop, direction_id, dep_time, routes) {
    arrivals = []
    stop_id = stop_info(routes[0], stop)
    routes = ",".join(routes)  // CSV values to plug into request
    limit = ""  // can speed up process if the departure time is now()
    if (dep_time == now()){
        limit = '&page[limit]=10'
    }
    // Get all the needed information:
    content = get_json_content(
        'https://api-v3.mbta.com/predictions?filter[stop]=%s&filter[route]=%s&filter[direction_id]=%s&sort=arrival_time&include=trip,route&fields[route]=long_name,type&fields[trip]=headsign%s' %
        (stop_id, routes, direction_id, limit))

    // Useful function for user friendliness, the name + direction combo thing
    function name(route_id, trip_id) {
        route_name = None
        headsign = None
        if (routes.length == 1) {
            headsign = content['included'][0]['attributes']['headsign']
            if (content['included'][-1]['attributes']['type'] == 3) {
                return route_id + " - " + headsign
            }
            route_name = content['included'][-1]['attributes']['long_name']
            return route_name + " - " + headsign
        }
        else {
            for (x in content['included']) {
                if (x['type'] == 'trip' && x['id'] == trip_id) {
                    headsign = x['attributes']['headsign']
                    if (content['included'][-1]['attributes']['type'] == 3) {
                        return route_id + " - " + headsign
                    }
                }
                if (x['type'] == 'route' && x['id'] == route_id) {
                    route_name = x['attributes']['long_name']
                    continue
                }
            }
            return route_name + " - " + headsign
        }
    }
    // Evaluates whether or not to add an arrival, adds the arrival if it meets requirements
    for (stop in content['data']) {
        time = None
        if (stop['attributes']['departure_time'] != None) {
            time = stop['attributes']['departure_time']
        }
        else if (stop['attributes']['arrival_time'] != None) {
            time = stop['attributes']['departure_time']
        }
        else {
            continue
        }
        if (time == None) {
            throw ValueError('Instructions malfunction')
        }
        time = parseInt(get_time_stamp(str(time)))
        if (time > dep_time) {
            trip_id = stop['relationships']['trip']['data']['id']
            route_id = stop['relationships']['route']['data']['id']
            arrivals.push((time, stop['attributes']['direction_id'], trip_id,
                             name(route_id, trip_id),
                             stop['attributes']['stop_sequence']))
        }
    }
    if( arrivals.length == 0) {
        throw ProcessLookupError("No arrivals for %s, %s" % (stop, routes))
    }    
    arrivals.sort(function(a,b) {a[0]- b[0]})
    return arrivals[0]
}

// use *after* having obtained a trip_id from start_trip to find when that trip will arrive at another stop
function end_arrival(stop, direction_id, route, trip_id) {
    arrivals = []
    stop_id = stop_info(route, stop)
    content = get_json_content(
        'https://api-v3.mbta.com/predictions?filter[stop]=%s&filter[direction_id]=%s&filter[trip]=%s' %
        (stop_id, direction_id, trip_id))
    for (stop in content['data']) {
        if (stop['attributes']['departure_time'] == None) { 
            time = stop['attributes']['arrival_time']
        }
        else {
            time = stop['attributes']['departure_time']
        }
        time = parseInt(get_time_stamp(str(time)))
        arrivals.push(time)
    }
    return arrivals

}
// Used for wait-times
function duration_str(duration) {
    return str(parseInt(round(duration / 60))) + " minutes"
}

// returns the timestamp for the current time
function now() {
    return new Date().getTime
}

// A useful class for readability. Just a way of storing the time a user is at a stop and what route it is.
TimeLoc = function(time, place, route) {
    //need to make route an optional defaulting to "foot"
    this.time = time
    this.place = place
    this.route = route
}

Leg = function(start, end, distance) {
    this.start = start
        this.end = end
        this.distance = distance
        this.duration = this.end.time - this.start.time
}

Leg.prototype.str = function() {
    if (this.start.time == 0) {
            return "No available trips from " + this.start.place + " to " + this.start.place + " at this time, or there's a bug."
    }    
    if (this.start.route == "foot") {
            return ("Walk for %s, %s. Arrive at %s at %s" % (this.distance, duration_str(this.duration), this.end.place, pretty_time(this.end.time)))
    }
    return ("Depart on " + this.start.route + " from " + this.start.place + " at " + pretty_time(this.start.time) + " to arrive at " +
            this.end.place + " at " +
            pretty_time(this.end.time) + ". ")
}

Leg.prototype.time_since = function(other) {
    return this.start.time - other.end.time
}

// a Trip is made of Legs
class Trip {
    constructor(legs) {
        this.legs = legs;
        this.start = this.legs[0].start;
        this.end = legs[-1].end;
        this.duration = this.end.time - this.start.time;
    }
    __str__() {
        if (this.start.time == 0) {
            return "No available trips from " + this.start.place + " to " + this.start.place + " at this time, or there's a bug.";
        }
        description = "Start trip from %s to %s\n" % (this.start.place, this.end.place);
        // this.legs
        for (var i = 0; i < this.legs.length; i++) {
            leg = this.legs[i];
            if (leg.start.route != "foot") {
                if (i == 0) {
                    description += "Wait at %s for %s\n" % (this.start.place, duration_str(leg.start.time - now()));
                }
                else {
                    description += "Wait at %s for %s\n" % (leg.start.place, duration_str(leg.time_since(this.legs[i - 1])));
                }
            }
            description += str(leg) + "\n";
        }
        description += "Arrive at destination";
        return description;
    }
}


// takes in departure time, the name of the starting stop, the name of the ending stop, the direction id and
// the possible routes and returns a Leg object. Used by trip()
function identify_trip(dep_time, start, end, direction_id, route) {
    // find, check, filter, sort all incoming trips to the start stop.
    trip_start = start_arrival(start, direction_id, dep_time, route)
    //assert trip_start is not None
    trips_end = end_arrival(end, direction_id, route[0], trip_start[2])
    end_time = trips_end[0]
    end_trip = new Leg(new TimeLoc(trip_start[0], start, trip_start[3]),
                   new TimeLoc(end_time, end, trip_start[3]))
    return end_trip
}
// takes in a departure time for the whole trip, the stops used (in order), and the routes used (a nested list, each
// Leg could use a variety of routes, see examples below.
function trip(dep_time, stops, routes) {
    legs = []
    console.log(routes.length)
    for (var i = 0; i < routes.length; i++) {
        route = routes[i]
        if (route == "foot") {
            temp_trip = new Leg(new TimeLoc(dep_time, stops[i]),
                            new TimeLoc(dep_time + 60 * 4, stops[i + 1]), "1 mile")
            //assert temp_trip != None
        }
        else {
            try {
                temp_trip = identify_trip(dep_time, stops[i], stops[i + 1], '1', route)
            }
            finally {
                temp_trip = identify_trip(dep_time, stops[i], stops[i + 1], '0', route)
            }
        }
        console.log(temp_trip)
        legs.push(temp_trip)
        dep_time = temp_trip.end.time
    }
    return new Trip(legs)
}
t = new TimeLoc(now(), "Here")
console.log(t.place)
green = ("Green-E", "Green-B", "Green-C", "Green-D")
// pkst_trip = identify_trip(now(), "Copley", "Park Street", *green)
home_trips = [trip(now(), ("Copley", "Lechmere", "Somerville Ave @ Stone Ave"), [["Green-E"], ['87']])]
home_trips.push(trip(now(), ("Copley", "Lechmere", "Mcgrath Hwy @ Alston St"), [["Green-E"], ['80', '88']]))
home_trips.push(trip(now(),
                       ("Copley", "Park Street", "Central", "Prospect St @ Bishop Allen Dr",
                        "Somerville Ave @ Prospect St"),
                       (green, ["Red"], ["foot"], ["91"])))

// home_trips.push(trip(now(), ("Copley", "Park Street", "Kendall/MIT", "Sullivan", "30 prospect st"),
//                       [green, ["Red"], "foot", ["747"]])) <-- wasn't working cuz it's too late at night
for (home_trip in home_trips){
    console.log(home_trip)
}