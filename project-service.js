/**
 * PROJECT SERVICE - API VERSION (PERMANENT BACKEND STORAGE)
 * Communicates with backend server for permanent database storage
 */

class ProjectService {
    constructor() {
        this.API_URL = 'http://localhost:3000/api/projects';
        this.ADMIN_STORAGE_KEY = 'vishwash_admin_auth';
        this.init();
    }

    init() {
        console.log('✓ Project Service initialized (API Backend Mode)');
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
     * Check if admin is logged in
     */
    isAdminLoggedIn() {
        const session = localStorage.getItem(this.ADMIN_STORAGE_KEY);
        if (!session) return false;

        try {
            const data = JSON.parse(session);
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
     * Get all projects from backend (async)
     */
    async getAllProjects() {
        try {
            const response = await fetch(this.API_URL);
            if (!response.ok) throw new Error('Failed to fetch projects');
            const data = await response.json();
            return data.success ? data.projects : [];
        } catch (error) {
            console.warn('Backend unavailable, using fallback');
            return [];
        }
    }

    /**
     * Get all projects (synchronous fallback)
     */
    getAllProjectsSync() {
        // For use in synchronous contexts, returns from backend cache
        return window._projectsCache || [];
    }

    /**
     * Add new project (async)
     */
    async addProject(projectData) {
        if (!this.isAdminLoggedIn()) {
            return { success: false, message: 'Not authorized' };
        }

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
            });

            const data = await response.json();
            
            if (data.success) {
                // Update cache
                window._projectsCache = [...(window._projectsCache || []), data.project];
            }
            
            return data;
        } catch (error) {
            console.error('Error adding project:', error);
            return { success: false, message: 'Network error' };
        }
    }

    /**
     * Update project (async)
     */
    async updateProject(projectId, projectData) {
        if (!this.isAdminLoggedIn()) {
            return { success: false, message: 'Not authorized' };
        }

        try {
            const response = await fetch(`${this.API_URL}/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
            });

            const data = await response.json();
            
            if (data.success) {
                // Update cache
                const cache = window._projectsCache || [];
                const idx = cache.findIndex(p => p.id === projectId);
                if (idx >= 0) cache[idx] = data.project;
                window._projectsCache = cache;
            }
            
            return data;
        } catch (error) {
            console.error('Error updating project:', error);
            return { success: false, message: 'Network error' };
        }
    }

    /**
     * Delete project (async)
     */
    async deleteProject(projectId) {
        if (!this.isAdminLoggedIn()) {
            return { success: false, message: 'Not authorized' };
        }

        try {
            const response = await fetch(`${this.API_URL}/${projectId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (data.success) {
                // Update cache
                const cache = window._projectsCache || [];
                window._projectsCache = cache.filter(p => p.id !== projectId);
            }
            
            return data;
        } catch (error) {
            console.error('Error deleting project:', error);
            return { success: false, message: 'Network error' };
        }
    }

    /**
     * Load all projects from backend into cache
     */
    async loadProjectsToCache() {
        const projects = await this.getAllProjects();
        window._projectsCache = projects;
        return projects;
    }
}

// Create global instance
const projectService = new ProjectService();
