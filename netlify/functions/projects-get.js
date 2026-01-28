/**
 * NETLIFY FUNCTION: Get All Projects
 * Endpoint: GET /.netlify/functions/projects-get
 * Returns all projects from server storage
 */

const fs = require('fs');
const path = require('path');

// Database file path (Netlify uses /tmp for temporary storage, but we'll use process env)
const getDbPath = () => {
    // In production, use environment variable or default
    if (process.env.PROJECTS_DB_PATH) {
        return process.env.PROJECTS_DB_PATH;
    }
    // Fallback to projects-db.json in repo root
    return path.join(__dirname, '../../projects-db.json');
};

// Load projects from database
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

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const projects = loadProjects();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                projects: projects,
                count: projects.length
            })
        };
    } catch (error) {
        console.error('Error in projects-get:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Error fetching projects',
                error: error.message
            })
        };
    }
};
