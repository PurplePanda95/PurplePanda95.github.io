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

