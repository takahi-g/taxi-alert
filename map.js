// map.js
// --- Map Status ---
let map = null;
let eventMarkers = [];
let userMarker = null;

function initMap(lat, lon) {
    if (!map) {
        const mapEl = document.getElementById('map');
        if(!mapEl) return;
        map = L.map('map').setView([lat, lon], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);
    } else {
        map.setView([lat, lon], 13);
    }
    
    // 現在地マーカー
    if(userMarker) {
        userMarker.setLatLng([lat, lon]);
    } else {
        userMarker = L.marker([lat, lon]).addTo(map).bindPopup("<b>あなたの現在地</b>").openPopup();
    }
}
