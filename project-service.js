/**
 * PROJECT SERVICE - CLIENT-SIDE STORAGE VERSION
 * Uses localStorage for permanent project storage (no backend required)
 * Works perfectly on Netlify and other static hosting
 */

class ProjectService {
    constructor() {
        this.storage = projectStorage; // Uses project-storage.js
        this.ADMIN_STORAGE_KEY = 'vishwash_admin_auth';
        this.init();
    }

    init() {
        console.log('✓ Project Service initialized (Client-Side Storage Mode)');
    }

    /**
     * Check if current user is admin
     * @returns {boolean}
     */
    isAdminLoggedIn() {
        const session = localStorage.getItem(this.ADMIN_STORAGE_KEY);
        if (!session) return false;

        try {
            const data = JSON.parse(session);
            // Check if session has expired
            if (new Date().getTime() > data.expiresAt) {
                localStorage.removeItem(this.ADMIN_STORAGE_KEY);
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get all projects from storage
     */
    getAllProjects() {
        return this.storage.getAllProjects();
    }

    /**
     * Get single project by ID
     */
    getProjectById(projectId) {
        return this.storage.getProjectById(projectId);
    }

    /**
     * Add new project
     */
    addProject(projectData) {
        return this.storage.addProject(projectData);
    }

    /**
     * Update project
     */
    updateProject(projectId, projectData) {
        return this.storage.updateProject(projectId, projectData);
    }

    /**
     * Delete project
     */
    deleteProject(projectId) {
        return this.storage.deleteProject(projectId);
    }

    /**
     * Import projects from JSON
     */
    importProjects(projects) {
        return this.storage.importProjects(projects);
    }

    /**
     * Export all projects
     */
    exportProjects() {
        return this.storage.exportProjects();
    }

    /**
     * Get storage statistics
     */
    getStats() {
        return this.storage.getStats();
    }
}

// Create global instance
const projectService = new ProjectService();
