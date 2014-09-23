(function() {
  var DISTANCE, STOP, currentStop, getClosestStops, uniquify,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  STOP = {
    ID: 0,
    NAME: 1,
    LAT: 2,
    LNG: 3
  };

  DISTANCE = 0.4;

  currentStop = void 0;

  $(function() {
    var map, mapOptions;
    mapOptions = {
      center: {
        lat: 37.7833,
        lng: -122.4167
      },
      zoom: 13
    };
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    return navigator.geolocation.getCurrentPosition(function(position) {
      var boundsCircle, closeRoutes, closeStops, myPosition, route, routeLines, stop, stopMarkers, stops, _i, _j, _k, _len, _len1, _len2, _ref;
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
      closeStops.forEach(function(stop) {
        var marker;
        marker = new google.maps.Marker({
          position: {
            lat: stop[STOP.LAT],
            lng: stop[STOP.LNG]
          },
          map: map,
          title: stop[STOP.NAME],
          icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        });
        google.maps.event.addListener(marker, 'click', function() {
          var route, _i, _j, _len, _len1, _ref, _ref1, _results;
          if (currentStop) {
            stopMarkers[currentStop].setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
            _ref = window.stopsToRoutes[currentStop];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              route = _ref[_i];
              routeLines[route].forEach(function(routeLine) {
                return routeLine.setOptions({
                  strokeColor: '#FF0000',
                  zIndex: 0,
                  strokeWeight: 2
                });
              });
            }
          }
          currentStop = stop[STOP.ID];
          marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
          _ref1 = window.stopsToRoutes[currentStop];
          _results = [];
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            route = _ref1[_j];
            _results.push(routeLines[route].forEach(function(routeLine) {
              return routeLine.setOptions({
                strokeColor: '#0000FF',
                zIndex: 100,
                strokeWeight: 4
              });
            }));
          }
          return _results;
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
        _ref = window.routesToStops[route];
        for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
          stops = _ref[_k];
          routeLines[route].push(new google.maps.Polyline({
            path: stops.map(function(stop_id) {
              return {
                lat: window.stops[stop_id][STOP.LAT],
                lng: window.stops[stop_id][STOP.LNG]
              };
            }),
            geodesic: true,
            map: map,
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2
          }));
        }
      }
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
    var closeStops, id, km, stop, stopCoords, _ref;
    closeStops = [];
    _ref = window.stops;
    for (id in _ref) {
      stop = _ref[id];
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
