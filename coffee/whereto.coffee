STOP =
  ID: 0
  NAME: 1
  LAT: 2
  LNG: 3

ROUTE =
  ID: 0
  TAG: 1
  NAME: 2

DISTANCE = 0.4

NEXT_BUS_SECURITY_TOKEN = "07208823-cb4e-4845-9a43-b05034061a16"

COLORS = [
  "#1f77b4"
  "#aec7e8"
  "#ff7f0e"
  "#ffbb78"
  "#2ca02c"
  "#98df8a"
  "#d62728"
  "#ff9896"
  "#9467bd"
  "#c5b0d5"
  "#8c564b"
  "#c49c94"
  "#e377c2"
  "#f7b6d2"
  "#7f7f7f"
  "#c7c7c7"
  "#bcbd22"
  "#dbdb8d"
  "#17becf"
  "#9edae5"
]


buses = {}
for route_id, route of window.routes
  buses[route[ROUTE.TAG]] = {}

currentStop = undefined
currentRoutes = []
currentRouteColors = {}
currentRouteTagColors = {}
currentInfoWindow = undefined

$ ->
  mapOptions =
    center: { lat: 37.7833, lng: -122.4167 }
    zoom: 13

  ref = new Firebase("https://publicdata-transit.firebaseio.com/")
  map = new google.maps.Map document.getElementById('map'), mapOptions

  newBus = (bus, firebaseId) ->
    busLatLng = undefined
    tag = undefined
    marker = undefined
    busLatLng = new google.maps.LatLng(bus.lat, bus.lon)
    tag = bus.routeTag.toString()[0].toUpperCase() + bus.routeTag.toString().slice(1)
    markerOptions = {
      icon: "http://chart.googleapis.com/chart?chst=d_bubble_icon_text_small&chld=bus|bbT|" + tag + "|ff0000|eee"
      position: busLatLng
      map: map
      visible: false
    }

    currentRouteTags = currentRoutes.map (route_id) ->
      window.routes[route_id][ROUTE.TAG]

    markerOptions.visible = true if bus.routeTag in currentRouteTags

    markerOptions.icon = "http://chart.googleapis.com/chart?chst=d_bubble_icon_text_small&chld=bus|bbT|" + tag + "|" + currentRouteTagColors[bus.routeTag].slice(1) + "|eee" if bus.routeTag of currentRouteTagColors
    marker = new google.maps.Marker markerOptions

    console.log 'Adding', bus.routeTag, bus.id, marker
    buses[bus.routeTag][bus.id] = marker

  feq = (f1, f2) ->
    Math.abs(f1 - f2) < 0.000001

  google.maps.Marker.prototype.animatedMoveTo = (toLat, toLng) ->
    fromLat = @getPosition().lat()
    fromLng = @getPosition().lng()

    return if feq(fromLat, toLat) and feq(fromLng, toLng)

    frames = []

    percent = 0
    while percent < 1
      curLat = fromLat + percent * (toLat - fromLat)
      curLng = fromLng + percent * (toLng - fromLng)
      frames.push new google.maps.LatLng(curLat, curLng)
      percent += 0.005

    move = (marker, latlngs, index, wait) ->
      marker.setPosition latlngs[index]
      if index isnt latlngs.length - 1
        setTimeout (->
          move marker, latlngs, index + 1, wait
        ), wait

    move this, frames, 0, 25


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

    stopMarkers = {}
    infoWindow = new google.maps.InfoWindow();
    closeStops.forEach (stop) ->
      marker = new google.maps.Marker
        position: {lat: stop[STOP.LAT], lng: stop[STOP.LNG]}
        map: map,
        title: stop[STOP.NAME]
        icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'

      content = '<ul style="list-style-type:none; font-weight:700; padding:0; margin:0; white-space:nowrap">'
      for route_id, i in window.stopsToRoutes[stop[STOP.ID]]
        content += '<li style="color:' + COLORS[i] + ';">' + window.routes[route_id][1]
        content += ' - ' + window.routes[route][2] + '</li>\n' if window.routes[route_id][2] isnt ""
        content += '<span style="padding-left:10px;" class="prediction" id="' + route_id + stop[STOP.ID] + '"></span>'
      content += '</ul>'

      google.maps.event.addListener marker, 'click', ->
        if currentStop
          stopMarkers[currentStop].setIcon 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          for route_id in window.stopsToRoutes[currentStop]
            routeLines[route_id].forEach (routeLine)->
              routeLine.setOptions
                strokeColor: '#000000'
                strokeOpacity: 0.3
                zIndex: 0
                strokeWeight: 2
            for bus_id, bus_marker of buses[window.routes[route_id][ROUTE.TAG]]
              bus_marker.setVisible false

          infoWindow.close()

        currentStop = stop[STOP.ID]
        currentRoutes = window.stopsToRoutes[currentStop]

        currentRouteColors = {}
        currentRouteTagColors = {}
        for route_id, i in currentRoutes
          currentRouteColors[route_id] = COLORS[i]
          currentRouteTagColors[window.routes[route_id][ROUTE.TAG]] = COLORS[i]

        marker.setIcon 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'

        xmlURL = "http://webservices.nextbus.com/service/publicXMLFeed?command=predictionsForMultiStops&a=sf-muni"

        for route_id in window.stopsToRoutes[currentStop]
          routeLines[route_id].forEach (routeLine)->
            routeLine.setOptions
              strokeColor: currentRouteColors[route_id]
              strokeOpacity: 1.0
              zIndex: 100
              strokeWeight: 4
          routeTag = window.routes[route_id][ROUTE.TAG]
          xmlURL += "&" + routeTag + | + currentStop
          for bus_id, bus_marker of buses[routeTag]
            bus_marker.setIcon "http://chart.googleapis.com/chart?chst=d_bubble_icon_text_small&chld=bus|bbT|" + routeTag + "|" + currentRouteColors[route_id].slice(1) + "|eee"
            bus_marker.setVisible true

        infoWindow.setContent content
        infoWindow.open map, marker

      stopMarkers[stop[STOP.ID]] = marker

    closeRoutes = []
    for stop in closeStops
      closeRoutes = closeRoutes.concat window.stopsToRoutes[stop[STOP.ID]]
    closeRoutes = uniquify closeRoutes

    routeLines = {}
    for route in closeRoutes
      routeLines[route] = [] unless route in routeLines
      for stops in window.routesToStops[route]
        routeLines[route].push new google.maps.Polyline
          path: stops.map (stop_id) ->
            {lat: window.stops[stop_id][STOP.LAT], lng: window.stops[stop_id][STOP.LNG]}
          geodesic: true,
          map: map,
          strokeColor: '#000000',
          strokeOpacity: 0.3,
          strokeWeight: 2

    f = ref.child("sf-muni/vehicles").limit(200)
    f.on "child_added", (s) ->
      console.log 'adding', s.val().routeTag
      newBus s.val(), s.name()

    f.on "child_changed", (s) ->
      console.log 'updating', s.val().routeTag, s.name()
      busMarker = buses[s.val().routeTag][s.name()]
      if typeof busMarker is "undefined"
        newBus s.val(), s.name()
      else
        busMarker.animatedMoveTo s.val().lat, s.val().lon

    f.on "child_removed", (s) ->
      busMarker = buses[s.val().routeTag][s.name()]
      if typeof busMarker isnt "undefined"
        busMarker.setMap null
        delete buses[s.val().routeTag][s.name()]

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
