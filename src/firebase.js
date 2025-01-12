// src/firebase.js

// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDKsTRg9qfBah9ouYe5zNaiK2ZUU9t5dhY",
  authDomain: "finditfast-c1f12.firebaseapp.com",
  projectId: "finditfast-c1f12",
  storageBucket: "finditfast-c1f12.firebasestorage.app",
  messagingSenderId: "229477505258",
  appId: "1:229477505258:web:7f33f6ff95f26c91b6df93",
  measurementId: "G-SDYSN563FJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);  // Authentication
const db = getFirestore(app);  // Firestore
const storage = getStorage(app);  // Storage
const analytics = getAnalytics(app);  // Analytics

// Export services for use in other files
export { auth, db, storage, analytics };