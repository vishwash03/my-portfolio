/**
 * Firebase Project Service
 * Business logic layer - handles admin checks and project operations
 * 
 * ⚠️ This data must be shared across all users and devices
 * All operations are cloud-synchronized
 */

import { firebaseStorage } from './firebase-storage-service.js';
import { auth } from './firebase-config.js';

class FirebaseProjectService {
  constructor() {
    this.storage = firebaseStorage;
    this.currentUser = null;
    
    // Listen for auth changes
    auth.onAuthStateChanged(user => {
      this.currentUser = user;
      if (user) {
        console.log(`✅ User authenticated: ${user.email}`);
      } else {
        console.log('❌ User logged out');
      }
    });
  }

  /**
   * Check if current user is admin
   * @returns {Promise<Boolean>} True if admin
   */
  async isAdminLoggedIn() {
    if (!this.currentUser) return false;
    
    try {
      const isAdmin = await this.storage.isAdmin(this.currentUser.uid);
      return isAdmin;
    } catch (error) {
      console.error('❌ Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Get all projects (public)
   * Available to everyone
   */
  async getAllProjects() {
    return await this.storage.getAllProjects();
  }

  /**
   * Set up real-time updates for projects (public)
   * Everyone sees projects instantly as they are added/updated
   * 
   * @param {Function} callback - Called whenever projects change
   * @returns {Function} Unsubscribe function
   */
  onProjectsUpdate(callback) {
    return this.storage.onProjectsChange(callback);
  }

  /**
   * Get single project (public)
   */
  async getProjectById(projectId) {
    return await this.storage.getProjectById(projectId);
  }

  /**
   * Add new project (Admin only)
   * Project instantly visible on all devices
   * 
   * @param {Object} projectData - Project information
   * @returns {Promise<Object>} Created project
   */
  async addProject(projectData) {
    const isAdmin = await this.isAdminLoggedIn();
    if (!isAdmin) {
      throw new Error('❌ Admin access required to add projects');
    }

    try {
      const project = await this.storage.addProject(projectData);
      console.log('✅ New project added by admin:', project.id);
      return project;
    } catch (error) {
      console.error('❌ Failed to add project:', error);
      throw error;
    }
  }

  /**
   * Update project (Admin only)
   * Changes instantly visible on all devices
   * 
   * @param {String} projectId - Project ID
   * @param {Object} projectData - Updated data
   * @returns {Promise<Object>} Updated project
   */
  async updateProject(projectId, projectData) {
    const isAdmin = await this.isAdminLoggedIn();
    if (!isAdmin) {
      throw new Error('❌ Admin access required to update projects');
    }

    try {
      const updated = await this.storage.updateProject(projectId, projectData);
      console.log('✅ Project updated by admin:', projectId);
      return updated;
    } catch (error) {
      console.error('❌ Failed to update project:', error);
      throw error;
    }
  }

  /**
   * Delete project (Admin only)
   * Delete instantly visible on all devices
   * 
   * @param {String} projectId - Project ID
   * @returns {Promise<String>} Deleted project ID
   */
  async deleteProject(projectId) {
    const isAdmin = await this.isAdminLoggedIn();
    if (!isAdmin) {
      throw new Error('❌ Admin access required to delete projects');
    }

    try {
      await this.storage.deleteProject(projectId);
      console.log('✅ Project deleted by admin:', projectId);
    } catch (error) {
      console.error('❌ Failed to delete project:', error);
      throw error;
    }
  }

  /**
   * Bulk import projects (Admin only)
   * Used for migrating from localStorage to Firebase
   * 
   * @param {Array} projects - Array of project objects
   * @returns {Promise<Array>} Created projects
   */
  async importProjects(projects) {
    const isAdmin = await this.isAdminLoggedIn();
    if (!isAdmin) {
      throw new Error('❌ Admin access required to import projects');
    }

    try {
      const imported = await this.storage.importProjects(projects);
      console.log(`✅ ${imported.length} projects imported by admin`);
      return imported;
    } catch (error) {
      console.error('❌ Failed to import projects:', error);
      throw error;
    }
  }

  /**
   * Export all projects (Admin only)
   * For backup or migration
   * 
   * @returns {Promise<Array>} All projects as JSON
   */
  async exportProjects() {
    const isAdmin = await this.isAdminLoggedIn();
    if (!isAdmin) {
      throw new Error('❌ Admin access required to export projects');
    }

    try {
      const projects = await this.storage.exportProjects();
      console.log(`✅ ${projects.length} projects exported by admin`);
      return projects;
    } catch (error) {
      console.error('❌ Failed to export projects:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Get current user's email
   * @returns {String|null} User email or null
   */
  getCurrentUserEmail() {
    return this.currentUser?.email || null;
  }
}

// Create singleton instance
const projectService = new FirebaseProjectService();

export { projectService };
