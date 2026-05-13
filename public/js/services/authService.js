// public/js/services/authService.js

function initAuth() {
  document.getElementById("loginButton").onclick = showLoginModal;
  document.getElementById("logoutButton").onclick = logout;
  document.getElementById("adminModeButton").onclick = toggleAdminMode;

  document.getElementById("modalGoogleBtn").onclick = loginWithGoogle;
  document.getElementById("modalEmailBtn").onclick = handleEmailAuth;
  document.getElementById("modalToggleMode").onclick = toggleAuthMode;
  document.getElementById("modalClose").onclick = hideLoginModal;

  auth.onAuthStateChanged(async (user) => {
    currentUser = user || null;

    if (!user) {
      currentRole = "public";
      adminModeActive = false;
      updateAuthUi();
      refreshSelectedBuildingPopup();
      return;
    }

    currentRole = await loadUserRole(user);
    adminModeActive = false;
    hideLoginModal();
    updateAuthUi();
    refreshSelectedBuildingPopup();
  });
}

function showLoginModal() {
  document.getElementById("loginModal").style.display = "flex";
  document.getElementById("modalError").innerText = "";
}

function hideLoginModal() {
  document.getElementById("loginModal").style.display = "none";
  document.getElementById("modalEmail").value = "";
  document.getElementById("modalPassword").value = "";
  document.getElementById("modalError").innerText = "";
}

let authModalMode = "signin"; // "signin" or "register"

function toggleAuthMode() {
  authModalMode = authModalMode === "signin" ? "register" : "signin";
  const isRegister = authModalMode === "register";
  document.getElementById("modalTitle").innerText = isRegister ? "Create Account" : "Sign In";
  document.getElementById("modalEmailBtn").innerText = isRegister ? "Create Account" : "Sign In with Email";
  document.getElementById("modalToggleMode").innerText = isRegister
    ? "Already have an account? Sign in"
    : "No account? Create one";
  document.getElementById("modalError").innerText = "";
}

async function handleEmailAuth() {
  const email = document.getElementById("modalEmail").value.trim();
  const password = document.getElementById("modalPassword").value;
  const errorEl = document.getElementById("modalError");

  if (!email || !password) {
    errorEl.innerText = "Please enter email and password.";
    return;
  }

  try {
    if (authModalMode === "register") {
      await auth.createUserWithEmailAndPassword(email, password);
    } else {
      await auth.signInWithEmailAndPassword(email, password);
    }
  } catch (error) {
    console.error("Email auth failed:", error.message);
    errorEl.innerText = friendlyAuthError(error.code);
  }
}

async function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (error) {
    console.error("Google login failed:", error.message);
    document.getElementById("modalError").innerText = friendlyAuthError(error.code);
  }
}

function friendlyAuthError(code) {
  switch (code) {
    case "auth/user-not-found":    return "No account found with that email.";
    case "auth/wrong-password":    return "Incorrect password.";
    case "auth/email-already-in-use": return "An account with that email already exists.";
    case "auth/invalid-email":     return "Invalid email address.";
    case "auth/weak-password":     return "Password must be at least 6 characters.";
    case "auth/too-many-requests": return "Too many attempts. Try again later.";
    default: return "Authentication failed. Please try again.";
  }
}

async function logout() {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Logout failed:", error);
    alert("Logout failed. Check console for details.");
  }
}

async function loadUserRole(user) {
  try {
    const userRef = db.collection("users").doc(user.uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      await userRef.set({
        email: user.email || "",
        displayName: user.displayName || "",
        role: "public",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return "public";
    }

    return snap.data().role || "public";
  } catch (error) {
    console.error("Error loading user role:", error);
    return "public";
  }
}

function toggleAdminMode() {
  if (!isAdmin()) return;
  adminModeActive = !adminModeActive;
  updateAuthUi();
  refreshSelectedBuildingPopup();
}

function updateAuthUi() {
  const loginButton = document.getElementById("loginButton");
  const logoutButton = document.getElementById("logoutButton");
  const adminModeButton = document.getElementById("adminModeButton");
  const authStatus = document.getElementById("authStatus");

  if (!currentUser) {
    loginButton.style.display = "inline-block";
    logoutButton.style.display = "none";
    adminModeButton.style.display = "none";
    authStatus.innerText = "Public mode";
    return;
  }

  loginButton.style.display = "none";
  logoutButton.style.display = "inline-block";

  if (isAdmin()) {
    adminModeButton.style.display = "inline-block";
    adminModeButton.innerText = adminModeActive ? "🔴 Admin Mode ON" : "⚪ Admin Mode OFF";
    adminModeButton.style.backgroundColor = adminModeActive ? "#8b0000" : "#444";
  } else {
    adminModeButton.style.display = "none";
  }

  const modeLabel = isAdmin()
    ? (adminModeActive ? "admin (editing)" : "admin")
    : currentRole;

  authStatus.innerText = `${currentUser.email} · ${modeLabel}`;
}

function refreshSelectedBuildingPopup() {
  if (selectedBuilding) {
    createMarkerWithPopup(selectedBuilding);
  }
}
