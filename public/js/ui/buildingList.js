// public/js/ui/buildingList.js

function renderBuildingList(buildingArray) {
  const buildingList = document.getElementById("buildingList");
  buildingList.innerHTML = "";

  buildingArray.forEach((building) => {
    const li = document.createElement("li");
    li.textContent = building.name;

    li.onclick = () => {
      map.setView(building.coords, 17);
      createMarkerWithPopup(building);
    };

    buildingList.appendChild(li);
  });
}

function initVoiceSearch() {
  document.getElementById("voiceSearch").onclick = () => {
    if (!window.webkitSpeechRecognition) {
      alert("Voice search is not supported by this browser.");
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const query = event.results[0][0].transcript.toLowerCase();
      searchBuilding(query);
    };

    recognition.start();
  };
}

function searchBuilding(query) {
  const building = buildings.find((b) =>
    b.name.toLowerCase().includes(query)
  );

  if (!building) {
    alert("Building not found");
    return;
  }

  map.setView(building.coords, 17);
  createMarkerWithPopup(building);
}
