/**
 * Firebase Storage Service
 * Replaces localStorage with cloud-based Firestore
 * 
 * ⚠️ CRITICAL: 
 * - Do NOT use localStorage
 * - Store all project data in a cloud database (Firebase Firestore)
 * - Projects added from the admin page must appear on all devices
 * - This data must be shared across all users and devices
 */

import { 
  collection, 
  getDocs, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Timestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { db } from './firebase-config.js';

class FirebaseProjectStorage {
  constructor() {
    this.projectsCollection = 'projects';
  }

  /**
   * Get all projects (one-time read from cloud)
   * @returns {Promise<Array>} Array of projects with IDs
   */
  async getAllProjects() {
    try {
      const q = query(
        collection(db, this.projectsCollection),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      return [];
    }
  }

  /**
   * Set up real-time listener for projects
   * Automatically updates when data changes in Firestore
   * 
   * @param {Function} callback - Called with updated projects array
   * @returns {Function} Unsubscribe function to stop listening
   */
  onProjectsChange(callback) {
    try {
      const q = query(
        collection(db, this.projectsCollection),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const projects = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`✅ Real-time update: ${projects.length} projects`);
          callback(projects);
        },
        (error) => {
          console.error('❌ Real-time listener error:', error);
          // Fallback: try to fetch projects once if listener fails
          this.getAllProjects().then(callback);
        }
      );

      return unsubscribe; // Return unsubscribe function
    } catch (error) {
      console.error('❌ Error setting up real-time listener:', error);
      return () => {}; // Return dummy unsubscribe function
    }
  }

  /**
   * Get single project by ID
   * @param {String} projectId - The project document ID
   * @returns {Promise<Object|null>} Project object or null
   */
  async getProjectById(projectId) {
    try {
      const docRef = doc(db, this.projectsCollection, projectId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() 
        ? { id: docSnap.id, ...docSnap.data() } 
        : null;
    } catch (error) {
      console.error(`❌ Error fetching project ${projectId}:`, error);
      return null;
    }
  }

  /**
   * Add new project to Firestore
   * Admin only - projects instantly visible on all devices
   * 
   * @param {Object} projectData - Project information
   * @returns {Promise<Object>} Created project with ID
   */
  async addProject(projectData) {
    try {
      const docRef = await addDoc(
        collection(db, this.projectsCollection),
        {
          title: projectData.title || '',
          description: projectData.description || '',
          images: projectData.images || [],
          technologies: projectData.technologies || [],
          liveUrl: projectData.liveUrl || '',
          githubUrl: projectData.githubUrl || '',
          featured: projectData.featured || false,
          category: projectData.category || 'other',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      );

      console.log(`✅ Project added: ${docRef.id}`);
      return { id: docRef.id, ...projectData };
    } catch (error) {
      console.error('❌ Error adding project:', error);
      throw new Error(`Failed to add project: ${error.message}`);
    }
  }

  /**
   * Update existing project in Firestore
   * Changes instantly visible on all devices
   * 
   * @param {String} projectId - The project document ID
   * @param {Object} projectData - Updated project data
   * @returns {Promise<Object>} Updated project
   */
  async updateProject(projectId, projectData) {
    try {
      const docRef = doc(db, this.projectsCollection, projectId);
      await updateDoc(docRef, {
        ...projectData,
        updatedAt: Timestamp.now()
      });

      console.log(`✅ Project updated: ${projectId}`);
      return { id: projectId, ...projectData };
    } catch (error) {
      console.error(`❌ Error updating project ${projectId}:`, error);
      throw new Error(`Failed to update project: ${error.message}`);
    }
  }

  /**
   * Delete project from Firestore
   * Delete instantly visible on all devices
   * 
   * @param {String} projectId - The project document ID
   * @returns {Promise<String>} Deleted project ID
   */
  async deleteProject(projectId) {
    try {
      await deleteDoc(doc(db, this.projectsCollection, projectId));
      console.log(`✅ Project deleted: ${projectId}`);
      return projectId;
    } catch (error) {
      console.error(`❌ Error deleting project ${projectId}:`, error);
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  /**
   * Batch import multiple projects
   * Useful for migrating from localStorage to Firestore
   * 
   * @param {Array} projects - Array of project objects
   * @returns {Promise<Array>} Array of created projects with IDs
   */
  async importProjects(projects) {
    try {
      const results = [];
      for (const project of projects) {
        const docRef = await addDoc(
          collection(db, this.projectsCollection),
          {
            ...project,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          }
        );
        results.push({ id: docRef.id, ...project });
      }
      console.log(`✅ Imported ${results.length} projects`);
      return results;
    } catch (error) {
      console.error('❌ Error importing projects:', error);
      throw new Error(`Failed to import projects: ${error.message}`);
    }
  }

  /**
   * Export all projects
   * Useful for backup or migrating to another system
   * 
   * @returns {Promise<Array>} All projects with IDs
   */
  async exportProjects() {
    try {
      const projects = await this.getAllProjects();
      console.log(`✅ Exported ${projects.length} projects`);
      return projects;
    } catch (error) {
      console.error('❌ Error exporting projects:', error);
      throw new Error(`Failed to export projects: ${error.message}`);
    }
  }

  /**
   * Check admin access
   * @param {String} uid - Firebase user UID
   * @returns {Promise<Boolean>} Whether user is admin
   */
  async isAdmin(uid) {
    try {
      const adminDoc = await getDoc(doc(db, 'admin_users', uid));
      return adminDoc.exists() && adminDoc.data().role === 'admin';
    } catch (error) {
      console.error('❌ Error checking admin status:', error);
      return false;
    }
  }
}

// Create singleton instance
const firebaseStorage = new FirebaseProjectStorage();

export { firebaseStorage };
