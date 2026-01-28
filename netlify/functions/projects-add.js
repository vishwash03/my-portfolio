/**
 * NETLIFY FUNCTION: Add Project
 * Endpoint: POST /.netlify/functions/projects-add
 * Adds new project to server storage
 */

const fs = require('fs');
const path = require('path');

const getDbPath = () => {
    if (process.env.PROJECTS_DB_PATH) {
        return process.env.PROJECTS_DB_PATH;
    }
    return path.join(__dirname, '../../projects-db.json');
};

function loadProjects() {
    try {
        const dbPath = getDbPath();
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error loading projects:', error);
        return [];
    }
}

function saveProjects(projects) {
    try {
        const dbPath = getDbPath();
        const dir = path.dirname(dbPath);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(dbPath, JSON.stringify(projects, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error saving projects:', error);
        return false;
    }
}

// Simple auth check (matches client-side)
function isAuthorized(event) {
    const auth = event.headers['x-admin-auth'];
    if (!auth) return false;
    
    try {
        const data = JSON.parse(Buffer.from(auth, 'base64').toString());
        if (new Date().getTime() > data.expiresAt) return false;
        return true;
    } catch (e) {
        return false;
    }
}

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Auth',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Check authorization
        if (!isAuthorized(event)) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ success: false, message: 'Not authorized' })
            };
        }

        const projectData = JSON.parse(event.body);

        // Validate required fields
        if (!projectData.title || !projectData.description) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Title and description required' 
                })
            };
        }

        // Load existing projects
        const projects = loadProjects();

        // Create new project
        const newProject = {
            id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
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
            featured: projectData.featured || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add to projects
        projects.push(newProject);

        // Save to database
        if (!saveProjects(projects)) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ success: false, message: 'Error saving project' })
            };
        }

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Project added successfully',
                project: newProject
            })
        };
    } catch (error) {
        console.error('Error in projects-add:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Error adding project',
                error: error.message
            })
        };
    }
};
