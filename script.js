const buildings = [
    { name: "Burruss Hall", coords: [37.228384, -80.423418] },
    { name: "Newman Library", coords: [37.229624, -80.419529] },
    { name: "McBryde Hall", coords: [37.229139, -80.421322] },
    { name: "Goodwin Hall", coords: [37.231507, -80.415436] },
    { name: "Torgersen Hall", coords: [37.229866, -80.418103] },
    { name: "Squires Student Center", coords: [37.229135, -80.416478] },
    { name: "Hancock Hall", coords: [37.228524, -80.419311] },
    { name: "War Memorial Hall", coords: [37.229946, -80.417698] },
    { name: "Randolph Hall", coords: [37.230682, -80.421006] },
    { name: "Holtzman Alumni Center", coords: [37.223667, -80.418438] }
];

function initMap() {
    const map = L.map('map').setView([37.228384, -80.423418], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    loadBuildings(map);
}

function loadBuildings(map) {
    const buildingList = document.getElementById("buildingList");
    buildings.forEach(building => {
        const li = document.createElement("li");
        li.textContent = building.name;
        li.onclick = () => {
            map.setView(building.coords, 17);
            L.marker(building.coords).addTo(map)
                .bindPopup(building.name)
                .openPopup();
        };
        buildingList.appendChild(li);

        // Add markers on map load
        L.marker(building.coords).addTo(map)
            .bindPopup(building.name);
    });
}

document.getElementById('voiceSearch').onclick = () => {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
        const query = event.results[0][0].transcript.toLowerCase();
        searchBuilding(query);
    };
    recognition.start();
};

function searchBuilding(query) {
    const building = buildings.find(b => b.name.toLowerCase().includes(query));
    if (building) {
        map.setView(building.coords, 17);
        L.marker(building.coords).addTo(map)
            .bindPopup(building.name)
            .openPopup();
    }
}


document.addEventListener("DOMContentLoaded", initMap);
