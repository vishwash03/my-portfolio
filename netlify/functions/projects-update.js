/**
 * NETLIFY FUNCTION: Update Project
 * Endpoint: PUT /.netlify/functions/projects-update
 * Updates existing project
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

        const projectData = JSON.parse(event.body);
        const projectId = event.queryStringParameters?.id;

        if (!projectId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, message: 'Project ID required' })
            };
        }

        const projects = loadProjects();
        const projectIndex = projects.findIndex(p => p.id === projectId);

        if (projectIndex === -1) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ success: false, message: 'Project not found' })
            };
        }

        // Update project
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
            featured: projectData.featured !== undefined ? projectData.featured : projects[projectIndex].featured,
            updatedAt: new Date().toISOString()
        };

        projects[projectIndex] = updatedProject;

        if (!saveProjects(projects)) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ success: false, message: 'Error saving project' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Project updated successfully',
                project: updatedProject
            })
        };
    } catch (error) {
        console.error('Error in projects-update:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Error updating project',
                error: error.message
            })
        };
    }
};
