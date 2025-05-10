// src/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Network } from '@capacitor/network'; // Added import for Network

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBXSs0iDdPTtTPyaQnqgMjvKlj3tqLSgoc",
  authDomain: "appm-8f035.firebaseapp.com",
  projectId: "appm-8f035",
  storageBucket: "appm-8f035.firebasestorage.app", // Please double-check this value in your Firebase console
  messagingSenderId: "975444733611",
  appId: "1:975444733611:web:64ed44190187400e4791ee",
  measurementId: "G-EGBECSLSFM"
};

// Initialize Firebase
// Check if Firebase app already exists, otherwise initialize
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


// Enable offline persistence for Firestore
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // This can happen if multiple tabs are open, persistence can only be enabled in one tab at a time.
      console.warn("Firestore persistence failed due to multiple tabs open.");
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn("Firestore persistence is not supported in this browser.");
    }
  });

// Network state monitoring
let isOnline = true; // Assume online by default, will be updated by Network listener

// Initial network state check
Network.getStatus().then(status => {
  isOnline = status.connected;
  console.log(`Initial network status: ${isOnline ? 'Online' : 'Offline'}`);
});

// Listen for network status changes
Network.addListener('networkStatusChange', status => {
  isOnline = status.connected;
  console.log(`Network status changed: ${isOnline ? 'Online' : 'Offline'}`);
});

export { app, auth, db, storage, firebaseConfig, isOnline };
