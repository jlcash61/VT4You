// public/js/state.js

let map = null;
let newMarker = null;
let currentMarker = null;
let selectedBuilding = null;
let routingControl = null;

let buildings = [];

let currentUser = null;
let currentRole = "public";
let adminModeActive = false;

function isLoggedIn() {
  return !!currentUser;
}

function isTech() {
  return currentRole === "tech" || currentRole === "admin";
}

function isAdmin() {
  return currentRole === "admin";
}

function isAdminMode() {
  return currentRole === "admin" && adminModeActive;
}
