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