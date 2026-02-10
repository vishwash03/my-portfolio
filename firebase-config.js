/**
 * Firebase Configuration
 * ⚠️ IMPORTANT: Never commit real credentials to git
 * Use environment variables or Firebase Hosting for production
 */

// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Your Firebase configuration (✅ Updated with actual credentials)
const firebaseConfig = {
  apiKey: "AIzaSyC0GXFjV26AcgDParpZWof5gVCtDaWhidw",
  authDomain: "portfolio-projects-a9c81.firebaseapp.com",
  projectId: "portfolio-projects-a9c81",
  storageBucket: "portfolio-projects-a9c81.firebasestorage.app",
  messagingSenderId: "966893148494",
  appId: "1:966893148494:web:2cfbf5fdd151515463661f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firestore instance
const db = getFirestore(app);

// Get Authentication instance
const auth = getAuth(app);

// Get Storage instance for images
const storage = getStorage(app);

// Set persistence to LOCAL (keeps user logged in)
auth.setPersistence('LOCAL').catch(error => {
  console.error('Error setting persistence:', error);
});

console.log('✅ Firebase initialized successfully');

export { db, auth, storage, app };
