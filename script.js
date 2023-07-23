var marker;
function initialize() {
    getCities().then(res => {
        var center = {lat: 0, lng: 0};
        var city = res[parseInt(Math.random()*(res.length-1))]
        console.log(city);
        city.lat = parseFloat(city.lat);
        city.lng = parseFloat(city.lng);
        const map = new google.maps.Map(document.getElementById("map"), {
            center: center,
            zoom: 2,
        });
        const panorama = new google.maps.StreetViewPanorama(
            document.getElementById("pano"),
            {
            position: city,
            disableDefaultUI: true,
            pov: {
                heading: 34,
                pitch: 10,
            },
            }
        );
        marker = new google.maps.Marker({
            position: center,
            map: map
        });
        
        map.addListener('click', function(e) {
            marker.setMap(null);
            marker = new google.maps.Marker({
                position: e.latLng,
                map: map
            });
            marker.setMap(map);
        });
        document.querySelector("#submit").addEventListener('click', function() {
            var lat = marker.getPosition().lat();
            var lng = marker.getPosition().lng();
        
            const flightPlanCoordinates = [
                { lat: lat, lng: lng},
                { lat: city.lat, lng: city.lng},
            ];
            const flightPath = new google.maps.Polyline({
                    path: flightPlanCoordinates,
                    geodesic: true,
                    strokeColor: "#FF0000",
                    strokeOpacity: 1.0,
                    strokeWeight: 2,
                });
            var actualPosition = new google.maps.Marker({
                position: city,
                map: map
            });
            flightPath.setMap(map);
            var bounds = new google.maps.LatLngBounds();
            bounds.extend(flightPlanCoordinates[0]);
            bounds.extend(flightPlanCoordinates[1]);
            map.fitBounds(bounds);
            getName(city.lat, city.lng).then(loc => {
                document.querySelector("#distance").innerHTML = `${getDistanceFromLatLonInKm(lat, lng, city.lat, city.lng)}km from \n ${loc}`;
            });
        })

        
       
    })   
    map.setStreetView(panorama);
}
function placeMarker(position, map) {
    var marker = new google.maps.Marker({
        position: position,
        map: map
    });
    map.panTo(position);
} 
async function getCities(){
    var res = await fetch("https://raw.githubusercontent.com/lutangar/cities.json/master/cities.json");
    var json = await res.json();
    return json;
}

async function getCity(){
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.3geonames.org/?randomland=yes.xml");

    // If specified, responseType must be empty string or "document"
    xhr.responseType = "document";

    // Force the response to be parsed as XML
    xhr.overrideMimeType("text/xml");

    xhr.onload = () => {
    if (xhr.readyState === xhr.DONE && xhr.status === 200) {
        console.log(xhr.response, xhr.responseXML);
    }
    };

    xhr.send();

}

async function getName(lat, lng){
    var res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&sensor=true&key=AIzaSyC1-KJWBwMDlCku2Ce1POI0ldyehlsCB1I`);
    var json = await res.json();
    console.log(json)
    var location = "Couldn't get location";
    try{
        location = json["results"][0].formatted_address;
    }catch(err){
        console.log(json);
        console.log(console.error());
    }
    return location;
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return parseInt(d);
  }
  
  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }
window.initialize = initialize;