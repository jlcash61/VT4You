let map;
let newMarker;
let buildings = [];
let adminMode = false;
let currentMarker = null; // Variable to track the current marker

// Firebase setup
const firebaseConfig = {
    apiKey: "AIzaSyD9bThpap2dNgZQPwr6jPsy0qFRLBTjMtg",
    authDomain: "vt4you-2024.firebaseapp.com",
    projectId: "vt4you-2024",
    storageBucket: "vt4you-2024.appspot.com",
    messagingSenderId: "636209323237",
    appId: "1:636209323237:web:93f3ef9b357aae7edd080c",
    measurementId: "G-44H3JN4XF7"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

function initMap() {
    map = L.map('map').setView([37.228384, -80.423418], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    map.on('click', onMapClick);

    loadBuildings();
    fetchWeather();
}

function fetchWeather() {
    const weatherUrl = "https://api.open-meteo.com/v1/forecast?latitude=37.228384&longitude=-80.423418&current_weather=true";

    fetch(weatherUrl)
        .then(response => response.json())
        .then(data => {
            const weather = data.current_weather;
            const tempCelsius = weather.temperature;
            const tempFahrenheit = (tempCelsius * 9/5) + 32;
            const description = weather.weathercode_description || 'Clear'; // Default to 'Clear' if description is undefined

            // Display weather information in the header in Fahrenheit
            document.getElementById('weather').innerText = `Blacksburg: ${tempFahrenheit.toFixed(1)}°F, ${description}`;
        })
        .catch(error => {
            console.error("Error fetching weather data:", error);
            document.getElementById('weather').innerText = "Weather data not available";
        });
}



function loadBuildings() {
    const buildingList = document.getElementById("buildingList");
    buildingList.innerHTML = '';  // Clear the list before reloading
    db.collection("buildings").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const building = { ...doc.data(), id: doc.id };
            buildings.push(building); // Now buildings array will have objects with IDs
            const li = document.createElement("li");
            li.textContent = building.name;
            li.onclick = () => {
                map.setView(building.coords, 17);
                createMarkerWithPopup(building);
            };
            buildingList.appendChild(li);

            // Add markers on map load
            //createMarkerWithPopup(building);
        });
    }).catch((error) => {
        console.error("Error loading buildings: ", error);
    });
}

function createMarkerWithPopup(building) {
    // Check if a marker exists and log the removal
    if (currentMarker) {

        map.removeLayer(currentMarker);
        currentMarker = null; // Clear the currentMarker after removal
    }

    // Add the new marker for the selected building
    currentMarker = L.marker(building.coords).addTo(map);


    let popupContent = `<b>${building.name}</b><br>`;

    if (building.details && building.details.length > 0) {
        building.details.forEach(detail => {
            popupContent += `${detail.key}: ${detail.value}<br>`;
        });
    }

    if (adminMode) {
        popupContent += `<button onclick="editBuilding('${building.id}')">Edit</button>`;
        popupContent += `<button onclick="deleteBuilding('${building.id}')">Delete</button>`;
    }

    currentMarker.bindPopup(popupContent).openPopup();

    // Update the selected building and show the "Route Me There" button
    selectedBuilding = building;
    document.getElementById('routeButton').style.display = 'inline-block';
}




function onMapClick(e) {
    if (!adminMode) {
        alert("You must be logged in as admin to add buildings.");
        return;
    }

    const latlng = e.latlng;
    if (newMarker) {
        map.removeLayer(newMarker); // Remove the previous marker if it exists
    }
    newMarker = L.marker(latlng).addTo(map)
        .bindPopup("New Building Location")
        .openPopup();



    // Prompt the user for a building name
    const buildingName = prompt("Enter the name of the new building:");

    if (buildingName) {
        const newBuilding = { name: buildingName, coords: [latlng.lat, latlng.lng] };
        addBuildingDetails(newBuilding);
    }
}

function addBuildingDetails(building) {
    let details = [];
    let addMore = true;

    while (addMore) {
        const key = prompt("Enter detail name (e.g., Department, Year Built):");
        if (key) {
            const value = prompt(`Enter the value for ${key}:`);
            if (value) {
                details.push({ key: key, value: value });
            }
        }
        addMore = confirm("Do you want to add more details?");
    }

    building.details = details;
    saveBuilding(building);
}

function saveBuilding(building) {
    db.collection("buildings").add(building).then(() => {
        buildings.push(building);
        loadBuildings(); // Reload the building list with the new building added
    }).catch((error) => {
        console.error("Error adding document: ", error);
    });
}

function editBuilding(id) {
    console.log("Editing building");
    console.log("Editing building with ID: ", id);
    const building = buildings.find(b => b.id === id);
    if (!building) return;

    const newName = prompt("Edit the building name:", building.name);
    if (newName) building.name = newName;

    building.details.forEach((detail, index) => {
        const newValue = prompt(`Edit ${detail.key}:`, detail.value);
        if (newValue) building.details[index].value = newValue;
    });

    db.collection("buildings").doc(id).update(building).then(() => {
        loadBuildings();
    }).catch((error) => {
        console.error("Error updating building: ", error);
    });
}

function deleteBuilding(id) {
    console.log("Delete building with ID: ", id);
    if (confirm("Are you sure you want to delete this building?")) {
        db.collection("buildings").doc(id).delete().then(() => {
            loadBuildings();
        }).catch((error) => {
            console.error("Error deleting building: ", error);
        });
    }
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
        createMarkerWithPopup(building);
    } else {
        alert("Building not found");
    }
}

// Admin Login/Logout Functionality
document.getElementById('adminLogin').onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then((result) => {
        // Check if the user is the authorized admin
        if (result.user.email === "jlcash61@gmail.com") {
            adminMode = true;
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminLogout').style.display = 'inline-block';
            alert(`Logged in as ${result.user.email}`);
            loadBuildings(); // Reload buildings to show edit/delete buttons
        } else {
            alert("You are not authorized to access admin mode.");
            auth.signOut(); // Sign out if the user is not authorized
        }
    }).catch((error) => {
        console.error("Login failed: ", error.message);
    });
};

document.getElementById('adminLogout').onclick = () => {
    auth.signOut().then(() => {
        adminMode = false;
        document.getElementById('adminLogin').style.display = 'inline-block';
        document.getElementById('adminLogout').style.display = 'none';
        alert("Logged out");
        loadBuildings(); // Reload buildings to hide edit/delete buttons
    }).catch((error) => {
        console.error("Logout failed:", error);
    });
};

let selectedBuilding = null;
let routingControl = null;

function createMarkerWithPopup(building) {
    const marker = L.marker(building.coords).addTo(map);
    let popupContent = `<b>${building.name}</b><br>`;

    if (building.details && building.details.length > 0) {
        building.details.forEach(detail => {
            popupContent += `${detail.key}: ${detail.value}<br>`;
        });
    }

    if (adminMode) {
        popupContent += `<button onclick="editBuilding('${building.id}')">Edit</button>`;
        popupContent += `<button onclick="deleteBuilding('${building.id}')">Delete</button>`;
    }

    marker.bindPopup(popupContent).openPopup();

    // Update the selected building and show the "Route Me There" button
    marker.on('click', () => {
        selectedBuilding = building;
        document.getElementById('routeButton').style.display = 'inline-block';
    });
}

document.getElementById('routeButton').onclick = () => {
    if (selectedBuilding) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const currentLocation = [position.coords.latitude, position.coords.longitude];
                routeToBuilding(currentLocation, selectedBuilding.coords);
            }, (error) => {
                alert("Could not retrieve your location. Please enable location services and try again.");
                console.error("Geolocation error:", error);
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    }
};

function routeToBuilding(startCoords, endCoords) {
    // Remove existing route if any
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
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            useHints: false,
            profile: 'car',
            unit: 'imperial' // Set the unit to 'imperial' for miles
        }),
        formatter: new L.Routing.Formatter({
            units: 'imperial'
        })
    }).addTo(map);
}

document.addEventListener("DOMContentLoaded", initMap);
