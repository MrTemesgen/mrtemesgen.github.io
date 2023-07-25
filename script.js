var marker;
var distance = document.querySelector("#distance");
var timer = document.querySelector("#timer");
var historyTable = document.querySelector("#history");
var showHistoryBtn = document.querySelector("#showhistory");
//defines which element we are writing to with type writer
var element = distance;
var text = "";
var typeSpeed = 25;
var textIndex = 0;
var timeOutID;
var seconds = 0;
var timerID;
var start = new Date();
var gameOver = false;
var historyShowing = false;
//time to solve
var tts;
function initialize() {
    getCities().then(res => {
        var center = {lat: 0, lng: 0};
        var city = res[parseInt(Math.random()*(res.length-1))]
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
                radius: 5000
            }
        );
        marker = new google.maps.Marker({
            position: center,
            map: map
        });
        
        map.addListener('click', function(e) {
            if(!gameOver){
                marker.setMap(null);
                marker = new google.maps.Marker({
                    position: e.latLng,
                    map: map
                });
                marker.setMap(map);
            }
        });
        document.querySelector("#submit").addEventListener('click', function() {
            if(!gameOver){
                gameOver = true;
                var lat = marker.getPosition().lat();
                var lng = marker.getPosition().lng();
                
                clearTimeout(timerID);
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
                    var distanceInKM = getDistanceFromLatLonInKm(lat, lng, city.lat, city.lng);
                    var formattedTime = tts.toISOString().substring(11, 22);
                    typeWrite(document.querySelector("#distance"), `${distanceInKM}km from ${loc}. Found in ${formattedTime} (hh:mm:ss.ms)`);
                    document.cookie = loc + "=" + JSON.stringify({
                        location: loc,
                        distanceInKM: distanceInKM,
                        time: formattedTime
                    });
                });
            }
        })
    })   
    

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

async function getName(lat, lng){
    var res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&sensor=true&key=AIzaSyC1-KJWBwMDlCku2Ce1POI0ldyehlsCB1I`);
    var json = await res.json();
    var location = "Couldn't get location";
    try{
        location = json["results"][5].formatted_address;
        
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

function typeWrite(ele, newText){
    element = ele;
    element.innerHTML = "";
    text = newText;
    textIndex = 0;
    typeWriteHelper();
}

function typeWriteHelper(){
    if(textIndex < text.length){
        element.innerHTML += text.charAt(textIndex);
        textIndex++;
        timeOutID = setTimeout(typeWriteHelper, typeSpeed);
    }else{
        clearTimeout(timeOutID);
    }
}

function getTime(){
    var date = new Date(0);
    date.setMilliseconds((Date.now()-start));
    return date;
}

function showHistoryTable(){
    if(!historyShowing){
        var cookies = getCookies();
        var table = `<table id="historyTable"><tr><th>Location</th><th>Distance</th><th>Time</th></tr>`
        for(var cookie of cookies){
            table += `<tr><td>${cookie.location}</th><td>${cookie.distanceInKM}km</td><td>${cookie.time}</td></tr>`       
        }
        table += `</table`;
        historyTable.innerHTML = table;
        showHistoryBtn.innerHTML = "Hide History";
    }else{
        historyTable.innerHTML = "";
        showHistoryBtn.innerHTML = "Show History";
    }
    historyShowing = !historyShowing;
}

function getCookies(){
    var pairs = document.cookie.split(";");
    var cookies = [];
    for (var i=0; i<pairs.length; i++){
        var pair = pairs[i].split("=");
        if(pair[1]){
            cookies.push(JSON.parse(pair[1]));
        }
    }
    cookies.sort(function(a, b){
        return a.distanceInKM - b.distanceInKM;
    })
    return cookies;
}

window.initialize = initialize;

typeWrite(element, "Mark the map to guess where you are...");
timerID = setInterval(function(){
    tts = getTime();
    timer.innerHTML = tts.toISOString().substring(11, 22);
}, 10);
showHistoryBtn.addEventListener('click', showHistoryTable)
