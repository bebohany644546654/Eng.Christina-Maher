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
const storage = getStorage(app);


// Configure Firestore for robust synchronization and offline support
import { enableMultiTabIndexedDbPersistence, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

// Enhanced Firestore initialization with multi-tab support and unlimited cache
const firestoreInstance = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// Enable multi-tab persistence for better cross-device sync
enableMultiTabIndexedDbPersistence(firestoreInstance)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not supported in this browser.');
    }
  });

// Network state monitoring with enhanced logging
let isOnline = true;
let networkRetryCount = 0;
const MAX_NETWORK_RETRIES = 3;

// Initial network state check with retry mechanism
const checkNetworkStatus = async () => {
  try {
    const status = await Network.getStatus();
    isOnline = status.connected;
    console.log(`Network status: ${isOnline ? 'Online' : 'Offline'}`);
    
    if (!isOnline && networkRetryCount < MAX_NETWORK_RETRIES) {
      networkRetryCount++;
      setTimeout(checkNetworkStatus, 5000); // Retry after 5 seconds
    } else {
      networkRetryCount = 0;
    }
  } catch (error) {
    console.error('Network status check failed:', error);
  }
};

// Initial check
checkNetworkStatus();

// Listen for network status changes with more robust handling
Network.addListener('networkStatusChange', (status) => {
  isOnline = status.connected;
  console.log(`Network status changed: ${isOnline ? 'Online' : 'Offline'}`);
  
  if (isOnline) {
    // Attempt to sync data when back online
    console.log('Network restored. Attempting data synchronization...');
  }
});

// Export with updated Firestore instance
const db = firestoreInstance; // Assign to a constant first

export { 
  app, 
  auth, 
  db, 
  storage, 
  firebaseConfig, 
  isOnline 
};
