// public/js/services/routingService.js

function initRouting() {
  document.getElementById("routeButton").onclick = routeToSelectedBuilding;
}

function routeToSelectedBuilding() {
  if (!selectedBuilding) return;

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const currentLocation = [
        position.coords.latitude,
        position.coords.longitude
      ];

      routeToBuilding(currentLocation, selectedBuilding.coords);
    },
    (error) => {
      alert("Could not retrieve your location. Please enable location services and try again.");
      console.error("Geolocation error:", error);
    }
  );
}

function routeToBuilding(startCoords, endCoords) {
  if (routingControl) {
    map.removeControl(routingControl);
  }

  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(startCoords),
      L.latLng(endCoords)
    ],
    routeWhileDragging: true,
    router: L.Routing.osrmv1({
      serviceUrl: "https://router.project-osrm.org/route/v1",
      useHints: false,
      profile: "car",
      unit: "imperial"
    }),
    formatter: new L.Routing.Formatter({
      units: "imperial"
    })
  }).addTo(map);
}
