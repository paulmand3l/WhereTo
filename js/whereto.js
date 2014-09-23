(function() {
  var STOP, getClosestStops, uniquify;

  STOP = {
    ID: 0,
    NAME: 1,
    LAT: 2,
    LNG: 3
  };

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
        radius: 400 + position.coords.accuracy
      });
      closeStops = getClosestStops(position);
      stopMarkers = closeStops.map(function(stop) {
        return new google.maps.Marker({
          position: {
            lat: stop[STOP.LAT],
            lng: stop[STOP.LNG]
          },
          map: map,
          title: stop[STOP.NAME]
        });
      });
      closeRoutes = [];
      for (_i = 0, _len = closeStops.length; _i < _len; _i++) {
        stop = closeStops[_i];
        closeRoutes = closeRoutes.concat(window.stopsToRoutes[stop[STOP.ID]]);
      }
      closeRoutes = uniquify(closeRoutes);
      console.log(closeRoutes);
      routeLines = [];
      for (_j = 0, _len1 = closeRoutes.length; _j < _len1; _j++) {
        route = closeRoutes[_j];
        console.log('route', route);
        _ref = window.routesToStops[route];
        for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
          stops = _ref[_k];
          console.log('stops', stops);
          routeLines.push(new google.maps.Polyline({
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
      if (km < 0.4) {
        closeStops.push(stop);
      }
    }
    return closeStops;
  };

}).call(this);
