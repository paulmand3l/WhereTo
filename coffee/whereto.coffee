STOP =
  ID: 0
  NAME: 1
  LAT: 2
  LNG: 3

DISTANCE = 0.4

$ ->
  mapOptions =
    center: { lat: 37.7833, lng: -122.4167 }
    zoom: 13

  map = new google.maps.Map document.getElementById('map'), mapOptions

  navigator.geolocation.getCurrentPosition (position) ->
    myPosition = {lat: position.coords.latitude, lng: position.coords.longitude}

    map.setCenter myPosition
    map.setZoom 16

    boundsCircle = new google.maps.Circle
      strokeColor: "#FFFFFF"
      strokeOpacity: 0.8,
      strokeWeight: 8,
      fillColor: "#FFFFFF",
      fillOpacity: 0,
      map: map,
      center: myPosition,
      radius: DISTANCE*1000 + position.coords.accuracy

    closeStops = getClosestStops position

    stopMarkers = closeStops.map (stop) ->
      new google.maps.Marker
        position: {lat: stop[STOP.LAT], lng: stop[STOP.LNG]}
        map: map,
        title: stop[STOP.NAME]

    closeRoutes = []

    for stop in closeStops
      closeRoutes = closeRoutes.concat window.stopsToRoutes[stop[STOP.ID]]

    closeRoutes = uniquify closeRoutes
    console.log closeRoutes

    routeLines = []
    for route in closeRoutes
      console.log 'route', route
      for stops in window.routesToStops[route]
        console.log 'stops', stops
        routeLines.push new google.maps.Polyline
          path: stops.map (stop_id) ->
            {lat: window.stops[stop_id][STOP.LAT], lng: window.stops[stop_id][STOP.LNG]}
          geodesic: true,
          map: map,
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2

    $(".output").text JSON.stringify closeStops, null, 2
  , (error) ->
    console.log 'error:', error.message

uniquify = (list) ->
  o = {}
  r = []
  for l in list
    o[l] = l
  for k, v of o
    r.push v
  r

# Throttle this if necessary
getClosestStops = (position) ->
  closeStops = []
  for id, stop of window.stops
    stopCoords =
      latitude: stop[STOP.LAT]
      longitude: stop[STOP.LNG]
    km = window.haversine(position.coords, stopCoords) - position.coords.accuracy * (1 / 1000)
    closeStops.push(stop) if km < DISTANCE
  closeStops
