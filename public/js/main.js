// public/js/main.js

function initMap() {
  map = L.map("map").setView([37.228384, -80.423418], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  map.on("click", onMapClick);

  loadBuildings();
  fetchWeather();
}

function onMapClick(e) {
  if (!isAdminMode()) return;

  const latlng = e.latlng;

  if (newMarker) {
    map.removeLayer(newMarker);
  }

  newMarker = L.marker(latlng)
    .addTo(map)
    .bindPopup("New Building Location")
    .openPopup();

  const buildingName = prompt("Enter the name of the new building:");
  if (!buildingName) return;

  const publicNotes = prompt("Enter public notes, if any:") || "";

  const newBuilding = {
    name: buildingName,
    coords: [latlng.lat, latlng.lng],
    publicNotes
  };

  saveBuilding(newBuilding);
}

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initMap();
  initRouting();
  initVoiceSearch();
});
