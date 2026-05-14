# VT4You

https://vt4you.tiborg.app

VT4You is a lightweight Virginia Tech campus navigation web app built with plain HTML, CSS, JavaScript, Leaflet, and Firebase.

The app is designed to help users quickly find campus buildings, view public building notes, and route to selected locations. It also includes an authenticated technician/admin layer for controlled operational information and building management.

## Current Status

VT4You is an active working project. The current build supports:

- Public campus building browsing
- Interactive Leaflet map centered on Virginia Tech
- Building list sidebar
- Building marker popups
- Public building notes
- Weather display for Blacksburg
- Route-to-building support using browser geolocation and OSRM routing
- Voice search for supported browsers
- Firebase Authentication
- Firestore-backed building storage
- Role-based access: `public`, `tech`, and `admin`
- Tech/admin-only secure building information
- Admin mode for editing building records
- Admin user management page
- Firebase Hosting deployment

## Architecture Overview

The app is intentionally simple and framework-free.

```text
public/
├── index.html              Main campus map UI
├── admin.html              Admin user-management UI
├── manifest.json           PWA manifest
├── assets/                 Logos and static images
├── icons/                  PWA icons
├── js/
│   ├── main.js             App startup and map initialization
│   ├── state.js            Shared runtime state and role helpers
│   ├── admin.js            Admin panel behavior
│   ├── config/
│   │   └── firebase-config.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── buildingService.js
│   │   ├── routingService.js
│   │   └── weatherService.js
│   └── ui/
│       ├── buildingList.js
│       └── buildingPopup.js
└── styles/
    ├── main.css
    └── admin.css
```

Firebase project files live at the repository root:

```text
firebase.json
firestore.rules
firestore.indexes.json
.firebaserc
```

## Runtime Model

The frontend runs in the browser. Firebase provides the backend services:

- Firebase Hosting serves the static app.
- Firebase Auth handles user login.
- Firestore stores building data, secure operational details, and user roles.
- Firestore Security Rules enforce public, tech, and admin access boundaries.

No custom Express/Node backend is currently required.

## User Roles

VT4You currently uses three roles stored in Firestore under `users/{uid}`:

| Role | Purpose |
|---|---|
| `public` | Default role. Can use public map features. |
| `tech` | Can view secure operational building information. |
| `admin` | Can view secure information and manage buildings/users. |

When a user signs in for the first time, the app creates a user document with the default role:

```json
{
  "email": "user@example.com",
  "displayName": "User Name",
  "role": "public",
  "createdAt": "server timestamp"
}
```

Admins can promote users through the admin panel at:

```text
/admin.html
```

## Firestore Data Model

### Buildings

Public building data is stored in root building documents:

```text
buildings/{buildingId}
```

Example:

```json
{
  "name": "Burruss Hall",
  "coords": [37.228384, -80.423418],
  "publicNotes": "Public-facing building notes",
  "campus": "Virginia Tech",
  "updatedAt": "server timestamp"
}
```

### Secure Building Information

Tech/admin-only operational data is stored separately in a secure subcollection:

```text
buildings/{buildingId}/secure/operational
```

Example:

```json
{
  "Panel Location": "Basement mechanical room",
  "Contact": "Facilities contact info"
}
```

This separation keeps public building data readable while protecting operational information through Firestore rules.

### Users

User roles are stored here:

```text
users/{uid}
```

Example:

```json
{
  "email": "tech@example.com",
  "displayName": "Tech User",
  "role": "tech",
  "createdAt": "server timestamp"
}
```

## Security Model

Firestore rules currently enforce the following:

- Anyone can read public building records.
- Only admins can create, update, or delete building records.
- Techs and admins can read secure building information.
- Only admins can write secure building information.
- Authenticated users can read their own user record.
- Admins can read user records for role management.
- Admins can update other users' roles.
- Admins cannot change their own role from the admin panel/rules path.

Important: frontend UI checks improve user experience, but Firestore Security Rules are the real authorization boundary.

## Main Features

### Public Map

The public map allows anyone with the link to:

- View the Virginia Tech campus map
- Select buildings from the sidebar
- View building names and public notes
- Route to a selected building
- Use voice search if supported by the browser
- View current Blacksburg weather

### Authentication

The app supports:

- Email/password sign-in
- Email/password account creation
- Google sign-in

New accounts default to `public` until an admin changes the role.

### Tech Access

Users with `tech` or `admin` role can view secure building information inside building popups.

### Admin Mode

Admins can toggle Admin Mode from the sidebar.

When Admin Mode is active, admins can:

- Add buildings by clicking the map
- Edit building names
- Edit public notes
- Add/edit secure operational fields
- Delete buildings
- Move building markers

### Admin Panel

The admin panel allows admins to manage user roles.

Admins can set users to:

- `public`
- `tech`
- `admin`

The panel intentionally prevents an admin from changing their own role.

## Local Development

Install the Firebase CLI if needed:

```bash
npm install -g firebase-tools
```

Log in:

```bash
firebase login
```

Select the Firebase project:

```bash
firebase use --add
```

Serve locally:

```bash
firebase serve
```

Or use Firebase emulators:

```bash
firebase emulators:start
```

Deploy hosting:

```bash
firebase deploy --only hosting
```

Deploy Firestore rules:

```bash
firebase deploy --only firestore:rules
```

Deploy everything configured in `firebase.json`:

```bash
firebase deploy
```

## Firebase Configuration

The app uses Firebase Web SDK v8 and initializes Firebase in:

```text
public/js/config/firebase-config.js
```

That file creates the shared Firebase Auth and Firestore instances:

```javascript
const auth = firebase.auth();
const db = firebase.firestore();
```

## External Services

VT4You currently uses:

- Leaflet for map display
- OpenStreetMap tiles
- Leaflet Routing Machine for route display
- OSRM public routing service
- Open-Meteo for weather data
- Browser Geolocation API for route starting location
- Browser speech recognition for voice search, where supported

## Known Notes

- The app currently uses browser `prompt`, `confirm`, and `alert` dialogs for admin editing workflows.
- Secure operational fields are flexible key/value entries.
- Public users can create an account, but they remain public until promoted by an admin.
- Firestore rules are the real protection layer; do not rely on hidden buttons alone.
- The project is intentionally kept framework-free while the app flow and data model are still evolving.

## Likely Next Improvements

Possible next steps:

- Replace prompt/confirm editing with proper forms/modals
- Improve mobile layout and sidebar behavior
- Add search input alongside voice search
- Add loading/status indicators for save/delete/move actions
- Add stronger confirmation language for deletes
- Add audit fields such as `createdAt`, `createdBy`, `updatedBy`
- Add role-change audit tracking
- Add admin-only building list filters
- Add support for multiple campuses or campus zones
- Add offline/PWA improvements
- Add import/export tooling for building data

## Project Philosophy

VT4You is built around a simple access model:

- Public campus navigation should be easy and useful.
- Operational building details should be available only to trusted users.
- Admin control should be explicit and limited.
- The app should stay understandable enough to maintain and evolve.
