$ ->
  mapOptions =
    center: { lat: 37.7833, lng: -122.4167 }
    zoom: 13

  map = new google.maps.Map document.getElementById('map'), mapOptions

  navigator.geolocation.getCurrentPosition (position) ->
    myPosition = {lat: position.coords.latitude, lng: position.coords.longitude}

    map.setCenter myPosition
    map.setZoom 17

    myLocation = new google.maps.Marker
      position: myPosition
      map: map
      title: 'You Are Here'

    closeStops = getClosestStops position

    stopMarkers = closeStops.map (stop) ->
      new google.maps.Marker
        position: {lat: stop[3], lng: stop[4]}
        map: map,
        title: stop[1]

    $(".output").text JSON.stringify closeStops, null, 2
  , (error) ->
    console.log 'error:', error.message

# Throttle this if necessary
getClosestStops = (position) ->
  stops.filter (stop) ->
    stopCoords =
      latitude: stop[3]
      longitude: stop[4]
    km = window.haversine(position.coords, stopCoords) + position.coords.accuracy * (1 / 1000)
    return km < 0.4

