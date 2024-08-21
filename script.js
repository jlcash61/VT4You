let map;
let newMarker;
let buildings = [];
let adminMode = false;

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
}

function loadBuildings() {
    const buildingList = document.getElementById("buildingList");
    buildingList.innerHTML = '';  // Clear the list before reloading
    db.collection("buildings").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const building = doc.data();
            buildings.push(building);

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
    }).catch((error) => {
        console.error("Error loading buildings: ", error);
    });
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
        } else {
            alert("You are not authorized to access admin mode.");
            auth.signOut(); // Sign out if the user is not authorized
        }
    }).catch((error) => {
        console.error("Login failed:", error);
    });
};

document.getElementById('adminLogout').onclick = () => {
    auth.signOut().then(() => {
        adminMode = false;
        document.getElementById('adminLogin').style.display = 'inline-block';
        document.getElementById('adminLogout').style.display = 'none';
        alert("Logged out");
    }).catch((error) => {
        console.error("Logout failed:", error);
    });
};

document.addEventListener("DOMContentLoaded", initMap);
