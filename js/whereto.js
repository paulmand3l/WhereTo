(function() {
  var COLORS, DISTANCE, ROUTE, STOP, buses, currentInfoWindow, currentRouteColors, currentRouteTagColors, currentRoutes, currentStop, getClosestStops, route, route_id, uniquify, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  STOP = {
    ID: 0,
    NAME: 1,
    LAT: 2,
    LNG: 3
  };

  ROUTE = {
    ID: 0,
    TAG: 1,
    NAME: 2
  };

  DISTANCE = 0.4;

  COLORS = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"];

  buses = {};

  _ref = window.routes;
  for (route_id in _ref) {
    route = _ref[route_id];
    buses[route[ROUTE.TAG]] = {};
  }

  currentStop = void 0;

  currentRoutes = [];

  currentRouteColors = {};

  currentRouteTagColors = {};

  currentInfoWindow = void 0;

  $(function() {
    var feq, map, mapOptions, newBus, ref;
    mapOptions = {
      center: {
        lat: 37.7833,
        lng: -122.4167
      },
      zoom: 13
    };
    ref = new Firebase("https://publicdata-transit.firebaseio.com/");
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    newBus = function(bus, firebaseId) {
      var busLatLng, currentRouteTags, marker, markerOptions, tag, _ref1;
      busLatLng = void 0;
      tag = void 0;
      marker = void 0;
      busLatLng = new google.maps.LatLng(bus.lat, bus.lon);
      tag = bus.routeTag.toString()[0].toUpperCase() + bus.routeTag.toString().slice(1);
      markerOptions = {
        icon: "http://chart.googleapis.com/chart?chst=d_bubble_icon_text_small&chld=bus|bbT|" + tag + "|ff0000|eee",
        position: busLatLng,
        map: map,
        visible: false
      };
      currentRouteTags = currentRoutes.map(function(route_id) {
        return window.routes[route_id][ROUTE.TAG];
      });
      if (_ref1 = bus.routeTag, __indexOf.call(currentRouteTags, _ref1) >= 0) {
        markerOptions.visible = true;
      }
      if (bus.routeTag in currentRouteTagColors) {
        markerOptions.icon = "http://chart.googleapis.com/chart?chst=d_bubble_icon_text_small&chld=bus|bbT|" + tag + "|" + currentRouteTagColors[bus.routeTag].slice(1) + "|eee";
      }
      marker = new google.maps.Marker(markerOptions);
      console.log('Adding', bus.routeTag, bus.id, marker);
      return buses[bus.routeTag][bus.id] = marker;
    };
    feq = function(f1, f2) {
      return Math.abs(f1 - f2) < 0.000001;
    };
    google.maps.Marker.prototype.animatedMoveTo = function(toLat, toLng) {
      var curLat, curLng, frames, fromLat, fromLng, move, percent;
      fromLat = this.getPosition().lat();
      fromLng = this.getPosition().lng();
      if (feq(fromLat, toLat) && feq(fromLng, toLng)) {
        return;
      }
      frames = [];
      percent = 0;
      while (percent < 1) {
        curLat = fromLat + percent * (toLat - fromLat);
        curLng = fromLng + percent * (toLng - fromLng);
        frames.push(new google.maps.LatLng(curLat, curLng));
        percent += 0.005;
      }
      move = function(marker, latlngs, index, wait) {
        marker.setPosition(latlngs[index]);
        if (index !== latlngs.length - 1) {
          return setTimeout((function() {
            return move(marker, latlngs, index + 1, wait);
          }), wait);
        }
      };
      return move(this, frames, 0, 25);
    };
    return navigator.geolocation.getCurrentPosition(function(position) {
      var boundsCircle, closeRoutes, closeStops, f, infoWindow, myPosition, routeLines, stop, stopMarkers, stops, _i, _j, _k, _len, _len1, _len2, _ref1;
      myPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      map.setCenter(myPosition);
      map.setZoom(16);
      boundsCircle = new google.maps.Circle({
        strokeColor: "#FFFFFF",
        strokeOpacity: 0.8,
        strokeWeight: 8,
        fillColor: "#FFFFFF",
        fillOpacity: 0,
        map: map,
        center: myPosition,
        radius: DISTANCE * 1000 + position.coords.accuracy
      });
      closeStops = getClosestStops(position);
      stopMarkers = {};
      infoWindow = new google.maps.InfoWindow();
      closeStops.forEach(function(stop) {
        var content, i, marker, _i, _len, _ref1;
        marker = new google.maps.Marker({
          position: {
            lat: stop[STOP.LAT],
            lng: stop[STOP.LNG]
          },
          map: map,
          title: stop[STOP.NAME],
          icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        });
        content = '<ul style="list-style-type:none; font-weight:700; padding:0; margin:0; white-space:nowrap">';
        _ref1 = window.stopsToRoutes[stop[STOP.ID]];
        for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
          route = _ref1[i];
          content += '<li style="color:' + COLORS[i] + ';">' + window.routes[route][1];
          if (window.routes[route][2] !== "") {
            content += ' - ' + window.routes[route][2] + '</li>\n';
          }
        }
        content += '</ul>';
        google.maps.event.addListener(marker, 'click', function() {
          var bus_id, bus_marker, routeTag, _j, _k, _l, _len1, _len2, _len3, _ref2, _ref3, _ref4, _ref5;
          if (currentStop) {
            stopMarkers[currentStop].setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
            _ref2 = window.stopsToRoutes[currentStop];
            for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
              route_id = _ref2[_j];
              routeLines[route_id].forEach(function(routeLine) {
                return routeLine.setOptions({
                  strokeColor: '#000000',
                  strokeOpacity: 0.3,
                  zIndex: 0,
                  strokeWeight: 2
                });
              });
              _ref3 = buses[window.routes[route_id][ROUTE.TAG]];
              for (bus_id in _ref3) {
                bus_marker = _ref3[bus_id];
                bus_marker.setVisible(false);
              }
            }
            infoWindow.close();
          }
          currentStop = stop[STOP.ID];
          currentRoutes = window.stopsToRoutes[currentStop];
          currentRouteColors = {};
          currentRouteTagColors = {};
          for (i = _k = 0, _len2 = currentRoutes.length; _k < _len2; i = ++_k) {
            route_id = currentRoutes[i];
            currentRouteColors[route_id] = COLORS[i];
            currentRouteTagColors[window.routes[route_id][ROUTE.TAG]] = COLORS[i];
          }
          marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
          _ref4 = window.stopsToRoutes[currentStop];
          for (_l = 0, _len3 = _ref4.length; _l < _len3; _l++) {
            route_id = _ref4[_l];
            routeLines[route_id].forEach(function(routeLine) {
              return routeLine.setOptions({
                strokeColor: currentRouteColors[route_id],
                strokeOpacity: 1.0,
                zIndex: 100,
                strokeWeight: 4
              });
            });
            routeTag = window.routes[route_id][ROUTE.TAG];
            _ref5 = buses[routeTag];
            for (bus_id in _ref5) {
              bus_marker = _ref5[bus_id];
              bus_marker.setIcon("http://chart.googleapis.com/chart?chst=d_bubble_icon_text_small&chld=bus|bbT|" + routeTag + "|" + currentRouteColors[route_id].slice(1) + "|eee");
              bus_marker.setVisible(true);
            }
          }
          infoWindow.setContent(content);
          return infoWindow.open(map, marker);
        });
        return stopMarkers[stop[STOP.ID]] = marker;
      });
      closeRoutes = [];
      for (_i = 0, _len = closeStops.length; _i < _len; _i++) {
        stop = closeStops[_i];
        closeRoutes = closeRoutes.concat(window.stopsToRoutes[stop[STOP.ID]]);
      }
      closeRoutes = uniquify(closeRoutes);
      routeLines = {};
      for (_j = 0, _len1 = closeRoutes.length; _j < _len1; _j++) {
        route = closeRoutes[_j];
        if (__indexOf.call(routeLines, route) < 0) {
          routeLines[route] = [];
        }
        _ref1 = window.routesToStops[route];
        for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
          stops = _ref1[_k];
          routeLines[route].push(new google.maps.Polyline({
            path: stops.map(function(stop_id) {
              return {
                lat: window.stops[stop_id][STOP.LAT],
                lng: window.stops[stop_id][STOP.LNG]
              };
            }),
            geodesic: true,
            map: map,
            strokeColor: '#000000',
            strokeOpacity: 0.3,
            strokeWeight: 2
          }));
        }
      }
      f = ref.child("sf-muni/vehicles").limit(200);
      f.on("child_added", function(s) {
        console.log('adding', s.val().routeTag);
        return newBus(s.val(), s.name());
      });
      f.on("child_changed", function(s) {
        var busMarker;
        console.log('updating', s.val().routeTag, s.name());
        busMarker = buses[s.val().routeTag][s.name()];
        if (typeof busMarker === "undefined") {
          return newBus(s.val(), s.name());
        } else {
          return busMarker.animatedMoveTo(s.val().lat, s.val().lon);
        }
      });
      f.on("child_removed", function(s) {
        var busMarker;
        busMarker = buses[s.val().routeTag][s.name()];
        if (typeof busMarker !== "undefined") {
          busMarker.setMap(null);
          return delete buses[s.val().routeTag][s.name()];
        }
      });
      return $(".output").text(JSON.stringify(closeStops, null, 2));
    }, function(error) {
      return console.log('error:', error.message);
    });
  });

  uniquify = function(list) {
    var k, l, o, r, v, _i, _len;
    o = {};
    r = [];
    for (_i = 0, _len = list.length; _i < _len; _i++) {
      l = list[_i];
      o[l] = l;
    }
    for (k in o) {
      v = o[k];
      r.push(v);
    }
    return r;
  };

  getClosestStops = function(position) {
    var closeStops, id, km, stop, stopCoords, _ref1;
    closeStops = [];
    _ref1 = window.stops;
    for (id in _ref1) {
      stop = _ref1[id];
      stopCoords = {
        latitude: stop[STOP.LAT],
        longitude: stop[STOP.LNG]
      };
      km = window.haversine(position.coords, stopCoords) - position.coords.accuracy * (1 / 1000);
      if (km < DISTANCE) {
        closeStops.push(stop);
      }
    }
    return closeStops;
  };

}).call(this);
