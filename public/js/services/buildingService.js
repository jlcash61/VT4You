// public/js/services/buildingService.js

async function loadBuildings() {
  const buildingList = document.getElementById("buildingList");
  buildingList.innerHTML = "";
  buildings = [];

  try {
    const querySnapshot = await db.collection("buildings").orderBy("name").get();

    querySnapshot.forEach((doc) => {
      const building = {
        id: doc.id,
        ...doc.data()
      };

      buildings.push(building);
    });

    renderBuildingList(buildings);
  } catch (error) {
    console.error("Error loading buildings:", error);
    alert("Error loading buildings. Check console.");
  }
}

async function loadSecureBuildingInfo(buildingId) {
  if (!isTech()) return null;

  try {
    const snap = await db
      .collection("buildings")
      .doc(buildingId)
      .collection("secure")
      .doc("operational")
      .get();

    if (!snap.exists) return null;

    return snap.data();
  } catch (error) {
    console.error("Error loading secure building info:", error);
    return null;
  }
}

async function saveBuilding(building) {
  if (!isAdminMode()) {
    alert("Enable Admin Mode to add buildings.");
    return;
  }

  try {
    const docRef = await db.collection("buildings").add({
      name: building.name,
      coords: building.coords,
      publicNotes: building.publicNotes || "",
      campus: building.campus || "Virginia Tech",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    const secureData = {};
    let addMore = confirm("Do you want to add secure (tech-only) fields for this building?");

    while (addMore) {
      const key = prompt("Enter field name (e.g., Panel Location, Contact):");
      if (!key) break;

      const value = prompt(`Enter value for "${key}":`);
      secureData[key] = value || "";

      addMore = confirm("Add another secure field?");
    }

    if (Object.keys(secureData).length > 0) {
      await db
        .collection("buildings")
        .doc(docRef.id)
        .collection("secure")
        .doc("operational")
        .set(secureData);
    }

    await loadBuildings();

  } catch (error) {
    console.error("Error adding building:", error);
    alert("Error saving building. Check console.");
  }
}

async function updateBuilding(id, updates) {
  if (!isAdminMode()) {
    alert("Enable Admin Mode to edit buildings.");
    return;
  }

  try {
    await db.collection("buildings").doc(id).update({
      ...updates,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await loadBuildings();
  } catch (error) {
    console.error("Error updating building:", error);
  }
}

async function deleteBuilding(id) {
  if (!isAdminMode()) {
    alert("Enable Admin Mode to delete buildings.");
    return;
  }

  if (!confirm("Are you sure you want to delete this building?")) return;

  try {
    await db.collection("buildings").doc(id).delete();
    await loadBuildings();
  } catch (error) {
    console.error("Error deleting building:", error);
  }
}
