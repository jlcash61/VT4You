// public/js/ui/buildingPopup.js

async function createMarkerWithPopup(building) {
  if (currentMarker) {
    map.removeLayer(currentMarker);
    currentMarker = null;
  }

  currentMarker = L.marker(building.coords).addTo(map);
  selectedBuilding = building;

  let popupContent = buildPublicPopupContent(building);

  const secureInfo = await loadSecureBuildingInfo(building.id);

  if (secureInfo) {
    popupContent += buildSecurePopupContent(secureInfo);
  }

  if (isAdminMode()) {
    popupContent += buildAdminPopupContent(building);
  }

  currentMarker.bindPopup(popupContent).openPopup();

  document.getElementById("routeButton").style.display = "inline-block";
}

function buildPublicPopupContent(building) {
  let html = `<b>${building.name}</b><br>`;

  if (building.publicNotes) {
    html += `<em>${building.publicNotes}</em><br>`;
  }

  return html;
}

function buildSecurePopupContent(secureInfo) {
  let html = `<hr><b>Tech Info</b><br>`;

  Object.entries(secureInfo).forEach(([key, value]) => {
    html += `${key}: ${value}<br>`;
  });

  return html;
}

function buildAdminPopupContent(building) {
  return `
    <hr>
    <button onclick="editBuilding('${building.id}')">Edit</button>
    <button onclick="deleteBuilding('${building.id}')">Delete</button>
  `;
}

async function editBuilding(id) {
  const building = buildings.find((b) => b.id === id);
  if (!building) return;

  const newName = prompt("Edit building name:", building.name);
  if (!newName) return;

  const publicNotes = prompt("Public notes:", building.publicNotes || "");

  await updateBuilding(id, {
    name: newName,
    publicNotes: publicNotes || ""
  });

  // Handle secure fields
  const existingSecure = await loadSecureBuildingInfo(id);

  if (existingSecure && Object.keys(existingSecure).length > 0) {
    const viewFirst = confirm("This building has existing secure fields. Click OK to review/edit them, Cancel to skip.");
    if (viewFirst) {
      const updatedSecure = { ...existingSecure };

      for (const [key, val] of Object.entries(existingSecure)) {
        const newVal = prompt(`Secure field "${key}":`, val);
        if (newVal !== null) {
          updatedSecure[key] = newVal;
        }
      }

      const addMore = confirm("Add any new secure fields?");
      if (addMore) {
        let keepAdding = true;
        while (keepAdding) {
          const key = prompt("Enter new field name:");
          if (!key) break;
          const value = prompt(`Enter value for "${key}":`);
          updatedSecure[key] = value || "";
          keepAdding = confirm("Add another?");
        }
      }

      await db
        .collection("buildings")
        .doc(id)
        .collection("secure")
        .doc("operational")
        .set(updatedSecure);
    }
  } else {
    const addSecure = confirm("No secure fields exist. Do you want to add some?");
    if (addSecure) {
      const secureData = {};
      let keepAdding = true;
      while (keepAdding) {
        const key = prompt("Enter field name:");
        if (!key) break;
        const value = prompt(`Enter value for "${key}":`);
        secureData[key] = value || "";
        keepAdding = confirm("Add another?");
      }

      if (Object.keys(secureData).length > 0) {
        await db
          .collection("buildings")
          .doc(id)
          .collection("secure")
          .doc("operational")
          .set(secureData);
      }
    }
  }
}
