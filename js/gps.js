// ══════════════════════════════════════════════
// ProTutor - GPS Location Detection
// ══════════════════════════════════════════════

// ── GPS ───────────────────────────────────────────────────────
var gpsRetryCount = 0;
function fetchGPS() {
  var btn = document.getElementById('gpsBtn');
  var txt = document.getElementById('gpsBtnTxt');
  var denied = document.getElementById('deniedBox');
  if (!navigator.geolocation) { txt.textContent = 'GPS not supported.'; return; }
  btn.disabled = true;
  btn.classList.add('detecting');
  txt.textContent = gpsRetryCount > 0 ? 'Retrying… (' + gpsRetryCount + '/3)' : 'Searching for your location…';
  denied.classList.remove('show');

  navigator.geolocation.getCurrentPosition(
    function(pos) {
      gpsRetryCount = 0;
      txt.textContent = 'Almost there…';
      locLat = pos.coords.latitude.toFixed(6);
      locLng = pos.coords.longitude.toFixed(6);
      locLink = 'https://www.google.com/maps?q=' + locLat + ',' + locLng;

      var MAPS_KEY = 'AIzaSyCMA1I5Cnb-d1W6rvzQSmTITvKCXF54kB0';

      function showAddress(displayLine, addr) {
        locAddr = addr || '';
        document.getElementById('locStreet').textContent = displayLine || '—';
        document.getElementById('locCoords').textContent = 'Lat: ' + locLat + ' · Lng: ' + locLng;
        locPinned = true;
        document.getElementById('locCard').classList.add('show');
        document.getElementById('retryBtn').classList.add('show');
        btn.className = 'gps-btn done';
        btn.classList.remove('detecting');
        btn.disabled = false;
        txt.textContent = 'Location Marked ✓';
        updatePg2Btn();
      }

      function parseComponents(comps) {
        var locality = [], city = '', route = '';
        (comps || []).forEach(function(c) {
          var types = c.types || [];
          var name = c.longText || c.long_name || '';
          if (types.indexOf('route') > -1) route = name;
          if (types.indexOf('sublocality_level_3') > -1 ||
              types.indexOf('sublocality_level_2') > -1 ||
              types.indexOf('sublocality_level_1') > -1 ||
              types.indexOf('sublocality') > -1 ||
              types.indexOf('neighborhood') > -1) {
            if (locality.indexOf(name) === -1) locality.push(name);
          }
          if (!city && types.indexOf('locality') > -1) city = name;
        });
        // Display: road, sublocalities, city — no door/premise/pincode
        var parts = [];
        if (route) parts.push(route);
        locality.forEach(function(l) { parts.push(l); });
        if (city) parts.push(city);
        return { displayLine: parts.join(', ') };
      }

      function geocoderFallback() {
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat: parseFloat(locLat), lng: parseFloat(locLng) } }, function(results, status) {
          if (status === 'OK' && results && results[0]) {
            var r = results[0];
            var p = parseComponents(r.address_components);
            showAddress(p.displayLine, r.formatted_address);
          } else {
            showAddress('—', '');
          }
        });
      }

      // Places API (New) — Nearby Search
      fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': MAPS_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.addressComponents'
        },
        body: JSON.stringify({
          locationRestriction: {
            circle: {
              center: { latitude: parseFloat(locLat), longitude: parseFloat(locLng) },
              radius: 50.0
            }
          },
          maxResultCount: 1
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.places && data.places.length > 0) {
          var place = data.places[0];
          var p = parseComponents(place.addressComponents);
          showAddress(p.displayLine, place.formattedAddress || '');
        } else {
          geocoderFallback();
        }
      })
      .catch(function() {
        geocoderFallback();
      });
    },
    function(err) {
      btn.disabled = false;
      txt.textContent = 'Choose My Location';
      if (err.code === 1) {
        // Permission denied — show instructions, don't retry
        gpsRetryCount = 0;
        btn.disabled = false;
        txt.textContent = 'Choose My Location';
        document.getElementById('deniedBox').classList.add('show');
      } else {
        // Timeout or unavailable — auto-retry up to 3 times
        if (gpsRetryCount < 3) {
          gpsRetryCount++;
          txt.textContent = 'Retrying… (' + gpsRetryCount + '/3)';
          setTimeout(fetchGPS, 1500);
        } else {
          gpsRetryCount = 0;
          btn.disabled = false;
          txt.textContent = 'Could not find location — tap to try again';
        }
      }
    },
    { timeout: 12000, enableHighAccuracy: true }
  );
}

function resetGPS() {
  gpsRetryCount = 0;
  locPinned = false; locLat = ''; locLng = ''; locAddr = ''; locLink = '';
  ['locCard','retryBtn','deniedBox'].forEach(function(id) {
    document.getElementById(id).classList.remove('show');
  });
  var btn = document.getElementById('gpsBtn');
  btn.className = 'gps-btn'; btn.disabled = false;
  document.getElementById('gpsBtnTxt').textContent = 'Choose My Location';
  updatePg2Btn();
}
