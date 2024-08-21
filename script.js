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
            buildings.push({ ...building, id: doc.id });

            const li = document.createElement("li");
            li.textContent = building.name;
            li.onclick = () => {
                map.setView(building.coords, 17);
                createMarkerWithPopup(building);
            };
            buildingList.appendChild(li);

            // Add markers on map load
            createMarkerWithPopup(building);
        });
    }).catch((error) => {
        console.error("Error loading buildings: ", error);
    });
}

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

document.addEventListener("DOMContentLoaded", initMap);
