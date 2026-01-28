/**
 * NETLIFY FUNCTION: Delete Project
 * Endpoint: DELETE /.netlify/functions/projects-delete
 * Deletes project from server storage
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
        if (!isAuthorized(event)) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ success: false, message: 'Not authorized' })
            };
        }

        const projectId = event.queryStringParameters?.id;

        if (!projectId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, message: 'Project ID required' })
            };
        }

        const projects = loadProjects();
        const filteredProjects = projects.filter(p => p.id !== projectId);

        if (filteredProjects.length === projects.length) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ success: false, message: 'Project not found' })
            };
        }

        if (!saveProjects(filteredProjects)) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ success: false, message: 'Error deleting project' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Project deleted successfully'
            })
        };
    } catch (error) {
        console.error('Error in projects-delete:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Error deleting project',
                error: error.message
            })
        };
    }
};
