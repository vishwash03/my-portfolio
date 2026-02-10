/**
 * Firebase Configuration & Services
 * Centralized Firebase setup for entire app
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Firebase Configuration
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
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

console.log('✅ Firebase connected');

// ===== PROJECTS SERVICE =====
export const projectsService = {
  // Get all projects
  async getAll() {
    try {
      const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      return [];
    }
  },

  // Get single project
  async getById(id) {
    try {
      const docRef = doc(db, 'projects', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      console.error('❌ Error fetching project:', error);
      return null;
    }
  },

  // Add new project
  async add(projectData) {
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        ...projectData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Project added:', docRef.id);
      return { id: docRef.id, ...projectData };
    } catch (error) {
      console.error('❌ Error adding project:', error);
      throw error;
    }
  },

  // Update project
  async update(id, projectData) {
    try {
      const docRef = doc(db, 'projects', id);
      await updateDoc(docRef, {
        ...projectData,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Project updated:', id);
    } catch (error) {
      console.error('❌ Error updating project:', error);
      throw error;
    }
  },

  // Delete project
  async delete(id) {
    try {
      await deleteDoc(doc(db, 'projects', id));
      console.log('✅ Project deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      throw error;
    }
  }
};

// ===== AUTH SERVICE =====
export const authService = {
  // Login admin
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Admin logged in:', email);
      return userCredential.user;
    } catch (error) {
      console.error('❌ Login error:', error.message);
      throw new Error(error.message);
    }
  },

  // Logout
  async logout() {
    try {
      await signOut(auth);
      console.log('✅ Logged out');
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },

  // Listen for auth changes
  onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
  }
};

// ===== STORAGE SERVICE =====
export const storageService = {
  // Upload image
  async uploadImage(file, path) {
    try {
      const storageRef = ref(storage, `portfolio/${path}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('✅ Image uploaded:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    }
  }
};

export { auth, db, storage };
