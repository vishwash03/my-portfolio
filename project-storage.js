/**
 * PROJECT STORAGE - HYBRID STORAGE (LOCAL + NETLIFY FUNCTIONS)
 * Uses localStorage as primary, Netlify Functions as backup for cloud persistence
 * Works both offline and online with automatic sync
 */

class ProjectStorage {
    constructor() {
        this.STORAGE_KEY = 'portfolio_projects';
        this.ADMIN_STORAGE_KEY = 'vishwash_admin_auth';
        this.MAX_STORAGE = 5242880; // 5MB limit
        this.NETLIFY_FUNCTIONS_ENABLED = this.detectNetlifyFunctions();
        this.API_BASE = this.getApiBase();
        this.init();
    }

    /**
     * Detect if we're running on Netlify with Functions
     */
    detectNetlifyFunctions() {
        const isDev = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
        return !isDev; // Enable functions in production
    }

    /**
     * Get API base URL
     */
    getApiBase() {
        if (this.detectNetlifyFunctions()) {
            return '/.netlify/functions';
        }
        // For local development
        return 'http://localhost:3000/api';
    }

    /**
     * Initialize storage and load projects
     */
    init() {
        const mode = this.NETLIFY_FUNCTIONS_ENABLED ? 'Hybrid (Local + Netlify Functions)' : 'Local Storage Only';
        console.log(`✓ Project Storage initialized (${mode})`);
        this.ensureStorageExists();
        // Try to sync with server if available
        if (this.NETLIFY_FUNCTIONS_ENABLED) {
            this.syncWithServer().catch(e => console.log('Server sync unavailable (offline)', e));
        }
    }

    /**
     * Ensure storage structure exists
     */
    ensureStorageExists() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
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
     * Get all projects from localStorage
     * @returns {Array}
     */
    getAllProjects() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading projects from storage:', error);
            return [];
        }
    }

    /**
     * Get single project by ID
     * @param {string} projectId
     * @returns {Object|null}
     */
    getProjectById(projectId) {
        const projects = this.getAllProjects();
        return projects.find(p => p.id === projectId) || null;
    }

    /**
     * Sync with Netlify Functions server
     */
    async syncWithServer() {
        if (!this.NETLIFY_FUNCTIONS_ENABLED) return;

        try {
            const response = await fetch(`${this.API_BASE}/projects-get`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.projects) {
                    // Compare server projects with local
                    const localProjects = this.getAllProjects();
                    if (JSON.stringify(localProjects) !== JSON.stringify(data.projects)) {
                        // Server has newer/different data, merge them
                        const merged = this.mergeProjects(localProjects, data.projects);
                        this.saveProjects(merged);
                        console.log('✓ Projects synced with server');
                    }
                }
            }
        } catch (error) {
            console.log('Server sync not available (working offline)');
        }
    }

    /**
     * Merge local and server projects intelligently
     */
    mergeProjects(local, server) {
        const merged = [...server];
        const serverIds = new Set(server.map(p => p.id));
        
        // Add local-only projects
        local.forEach(p => {
            if (!serverIds.has(p.id)) {
                merged.push(p);
            }
        });
        
        return merged;
    }

    /**
     * Add new project (syncs with Netlify if available)
     * @param {Object} projectData
     * @returns {Object} {success: boolean, message: string, project: Object}
     */
    addProject(projectData) {
        if (!this.isAdminLoggedIn()) {
            return { success: false, message: 'Not authorized' };
        }

        try {
            // Validate required fields
            if (!projectData.title || !projectData.description) {
                return { success: false, message: 'Title and description required' };
            }

            // Generate unique ID
            const projectId = 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

            // Create project object
            const newProject = {
                id: projectId,
                title: projectData.title,
                description: projectData.description,
                image: projectData.image || '',
                link: projectData.link || '',
                liveLink: projectData.liveLink || '',
                githubLink: projectData.githubLink || '',
                technologies: projectData.technologies || [],
                images: projectData.images || [],
                details: projectData.details || '',
                features: projectData.features || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Get existing projects
            const projects = this.getAllProjects();
            projects.push(newProject);

            // Save to localStorage
            if (!this.saveProjects(projects)) {
                return { success: false, message: 'Storage quota exceeded' };
            }

            // Sync with server if available
            if (this.NETLIFY_FUNCTIONS_ENABLED) {
                this.syncAddProjectToServer(newProject).catch(e => 
                    console.log('Server sync failed, using local storage:', e)
                );
            }

            console.log('✓ Project added:', projectId);
            return { success: true, message: 'Project added successfully', project: newProject };
        } catch (error) {
            console.error('Error adding project:', error);
            return { success: false, message: 'Error adding project: ' + error.message };
        }
    }

    /**
     * Sync add project to Netlify server (async, no blocking)
     */
    async syncAddProjectToServer(project) {
        if (!this.NETLIFY_FUNCTIONS_ENABLED) return;

        try {
            const session = localStorage.getItem(this.ADMIN_STORAGE_KEY);
            const response = await fetch(`${this.API_BASE}/projects-add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Auth': session ? Buffer.from(session).toString('base64') : ''
                },
                body: JSON.stringify(project)
            });

            if (response.ok) {
                console.log('✓ Project synced to server');
            }
        } catch (error) {
            console.log('Server sync unavailable, working offline');
        }
    }

    /**
     * Update existing project (syncs with Netlify)
     * @param {string} projectId
     * @param {Object} projectData
     * @returns {Object} {success: boolean, message: string, project: Object}
     */
    updateProject(projectId, projectData) {
        if (!this.isAdminLoggedIn()) {
            return { success: false, message: 'Not authorized' };
        }

        try {
            const projects = this.getAllProjects();
            const projectIndex = projects.findIndex(p => p.id === projectId);

            if (projectIndex === -1) {
                return { success: false, message: 'Project not found' };
            }

            // Update project fields
            const updatedProject = {
                ...projects[projectIndex],
                title: projectData.title || projects[projectIndex].title,
                description: projectData.description || projects[projectIndex].description,
                image: projectData.image !== undefined ? projectData.image : projects[projectIndex].image,
                link: projectData.link !== undefined ? projectData.link : projects[projectIndex].link,
                liveLink: projectData.liveLink !== undefined ? projectData.liveLink : projects[projectIndex].liveLink,
                githubLink: projectData.githubLink !== undefined ? projectData.githubLink : projects[projectIndex].githubLink,
                technologies: projectData.technologies || projects[projectIndex].technologies,
                images: projectData.images || projects[projectIndex].images,
                details: projectData.details !== undefined ? projectData.details : projects[projectIndex].details,
                features: projectData.features || projects[projectIndex].features,
                updatedAt: new Date().toISOString()
            };

            projects[projectIndex] = updatedProject;

            if (!this.saveProjects(projects)) {
                return { success: false, message: 'Storage quota exceeded' };
            }

            // Sync with server if available
            if (this.NETLIFY_FUNCTIONS_ENABLED) {
                this.syncUpdateProjectToServer(projectId, updatedProject).catch(e =>
                    console.log('Server sync failed, using local storage:', e)
                );
            }

            console.log('✓ Project updated:', projectId);
            return { success: true, message: 'Project updated successfully', project: updatedProject };
        } catch (error) {
            console.error('Error updating project:', error);
            return { success: false, message: 'Error updating project: ' + error.message };
        }
    }

    /**
     * Sync update project to Netlify server (async, no blocking)
     */
    async syncUpdateProjectToServer(projectId, project) {
        if (!this.NETLIFY_FUNCTIONS_ENABLED) return;

        try {
            const session = localStorage.getItem(this.ADMIN_STORAGE_KEY);
            const response = await fetch(`${this.API_BASE}/projects-update?id=${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Auth': session ? Buffer.from(session).toString('base64') : ''
                },
                body: JSON.stringify(project)
            });

            if (response.ok) {
                console.log('✓ Project update synced to server');
            }
        } catch (error) {
            console.log('Server sync unavailable, working offline');
        }
    }

    /**
     * Delete project (syncs with Netlify)
     * @param {string} projectId
     * @returns {Object} {success: boolean, message: string}
     */
    deleteProject(projectId) {
        if (!this.isAdminLoggedIn()) {
            return { success: false, message: 'Not authorized' };
        }

        try {
            const projects = this.getAllProjects();
            const filteredProjects = projects.filter(p => p.id !== projectId);

            if (filteredProjects.length === projects.length) {
                return { success: false, message: 'Project not found' };
            }

            if (!this.saveProjects(filteredProjects)) {
                return { success: false, message: 'Storage quota exceeded' };
            }

            // Sync with server if available
            if (this.NETLIFY_FUNCTIONS_ENABLED) {
                this.syncDeleteProjectToServer(projectId).catch(e =>
                    console.log('Server sync failed, using local storage:', e)
                );
            }

            console.log('✓ Project deleted:', projectId);
            return { success: true, message: 'Project deleted successfully' };
        } catch (error) {
            console.error('Error deleting project:', error);
            return { success: false, message: 'Error deleting project: ' + error.message };
        }
    }

    /**
     * Sync delete project to Netlify server (async, no blocking)
     */
    async syncDeleteProjectToServer(projectId) {
        if (!this.NETLIFY_FUNCTIONS_ENABLED) return;

        try {
            const session = localStorage.getItem(this.ADMIN_STORAGE_KEY);
            const response = await fetch(`${this.API_BASE}/projects-delete?id=${projectId}`, {
                method: 'DELETE',
                headers: {
                    'X-Admin-Auth': session ? Buffer.from(session).toString('base64') : ''
                }
            });

            if (response.ok) {
                console.log('✓ Project deletion synced to server');
            }
        } catch (error) {
            console.log('Server sync unavailable, working offline');
        }
    }

    /**
     * Save projects to localStorage
     * @param {Array} projects
     * @returns {boolean} Success status
     */
    saveProjects(projects) {
        try {
            const jsonData = JSON.stringify(projects);
            
            // Check storage size
            if (jsonData.length > this.MAX_STORAGE) {
                console.error('Storage quota exceeded');
                return false;
            }

            localStorage.setItem(this.STORAGE_KEY, jsonData);
            return true;
        } catch (error) {
            console.error('Error saving projects:', error);
            return false;
        }
    }

    /**
     * Import projects from JSON data
     * @param {Array} projects
     * @returns {Object} {success: boolean, message: string, count: number}
     */
    importProjects(projects) {
        if (!this.isAdminLoggedIn()) {
            return { success: false, message: 'Not authorized' };
        }

        try {
            if (!Array.isArray(projects)) {
                return { success: false, message: 'Invalid projects data' };
            }

            // Add missing IDs to imported projects
            const processedProjects = projects.map(p => ({
                id: p.id || 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                title: p.title || 'Untitled',
                description: p.description || '',
                image: p.image || '',
                link: p.link || '',
                liveLink: p.liveLink || '',
                githubLink: p.githubLink || '',
                technologies: p.technologies || [],
                images: p.images || [],
                details: p.details || '',
                features: p.features || [],
                createdAt: p.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }));

            if (!this.saveProjects(processedProjects)) {
                return { success: false, message: 'Storage quota exceeded' };
            }

            console.log(`✓ Imported ${processedProjects.length} projects`);
            return { 
                success: true, 
                message: `Successfully imported ${processedProjects.length} projects`,
                count: processedProjects.length 
            };
        } catch (error) {
            console.error('Error importing projects:', error);
            return { success: false, message: 'Error importing projects: ' + error.message };
        }
    }

    /**
     * Export all projects as JSON
     * @returns {Array}
     */
    exportProjects() {
        return this.getAllProjects();
    }

    /**
     * Clear all projects (admin only)
     * @returns {Object} {success: boolean, message: string}
     */
    clearAllProjects() {
        if (!this.isAdminLoggedIn()) {
            return { success: false, message: 'Not authorized' };
        }

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
            console.log('✓ All projects cleared');
            return { success: true, message: 'All projects cleared' };
        } catch (error) {
            console.error('Error clearing projects:', error);
            return { success: false, message: 'Error clearing projects: ' + error.message };
        }
    }

    /**
     * Get storage statistics
     * @returns {Object} {totalProjects: number, storageUsed: string, storageAvailable: string}
     */
    getStats() {
        try {
            const projects = this.getAllProjects();
            const data = localStorage.getItem(this.STORAGE_KEY);
            const bytesUsed = new Blob([data]).size;
            const bytesAvailable = this.MAX_STORAGE - bytesUsed;

            return {
                totalProjects: projects.length,
                storageUsed: (bytesUsed / 1024).toFixed(2) + ' KB',
                storageAvailable: (bytesAvailable / 1024).toFixed(2) + ' KB',
                percentUsed: ((bytesUsed / this.MAX_STORAGE) * 100).toFixed(2) + '%'
            };
        } catch (error) {
            return { totalProjects: 0, storageUsed: '0 KB', storageAvailable: '5000 KB' };
        }
    }
}

// Create global instance
const projectStorage = new ProjectStorage();
