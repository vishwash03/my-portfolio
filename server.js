/**
 * PROFESSIONAL BACKEND SERVER
 * Handles project storage permanently in database
 * Run: node server.js
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const app = express();

// Gmail Configuration
// ⚠️ IMPORTANT: READ EMAIL_SETUP.md FOR COMPLETE INSTRUCTIONS
// Steps:
// 1. Enable 2-Step Verification: https://myaccount.google.com/security
// 2. Generate App Password: https://myaccount.google.com/apppasswords
// 3. Replace EMAIL_PASSWORD below with your 16-character App Password
// 4. Restart server (node server.js)

const EMAIL_USER = 'vishwashtak977@gmail.com';
const EMAIL_PASSWORD = 'ztzr ufis cume abhy'; // Your Gmail app password
const RECIPIENT_EMAIL = 'vishwashtak977@gmail.com';

// Create email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD
    }
});

// Test email configuration
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Email configuration error:', error);
    } else {
        console.log('✅ Email service ready');
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// Database file path
const DB_FILE = path.join(__dirname, 'projects-db.json');

// Initialize database
function initDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ projects: [] }, null, 2));
    }
}

// Read all projects from database
function getProjects() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data).projects || [];
    } catch (error) {
        console.error('Error reading projects:', error);
        return [];
    }
}

// Save projects to database
function saveProjects(projects) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify({ projects }, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving projects:', error);
        return false;
    }
}

// Send email notification
async function sendProjectNotification(project) {
    try {
        const htmlContent = `
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background: #f5f5f5; }
                        .container { max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 10px; }
                        .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 20px; border-radius: 5px; }
                        .header h1 { margin: 0; font-size: 24px; }
                        .content { margin: 20px 0; }
                        .field { margin: 15px 0; }
                        .label { font-weight: bold; color: #333; }
                        .value { color: #555; margin-top: 5px; }
                        .tech-tags { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
                        .tag { background: #3b82f6; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; }
                        .footer { border-top: 1px solid #ddd; padding-top: 15px; text-align: center; color: #999; font-size: 12px; }
                        .image { max-width: 100%; height: auto; margin: 15px 0; border-radius: 5px; max-height: 250px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✨ New Project Added to Portfolio</h1>
                        </div>
                        
                        <div class="content">
                            <div class="field">
                                <div class="label">📋 Project Title:</div>
                                <div class="value">${project.title}</div>
                            </div>
                            
                            <div class="field">
                                <div class="label">📝 Description:</div>
                                <div class="value">${project.description}</div>
                            </div>
                            
                            <div class="field">
                                <div class="label">🔗 Project Link:</div>
                                <div class="value"><a href="${project.link || 'N/A'}" target="_blank">${project.link || 'Not provided'}</a></div>
                            </div>
                            
                            <div class="field">
                                <div class="label">🛠️ Technologies Used:</div>
                                <div class="tech-tags">
                                    ${project.technologies?.map(tech => `<span class="tag">${tech}</span>`).join('') || '<span style="color: #999;">No technologies specified</span>'}
                                </div>
                            </div>
                            
                            ${project.images && project.images.length > 0 ? `
                            <div class="field">
                                <div class="label">🖼️ Project Preview:</div>
                                <img src="${project.images[0]}" alt="Project preview" class="image">
                            </div>
                            ` : ''}
                            
                            <div class="field">
                                <div class="label">📅 Added on:</div>
                                <div class="value">${new Date(project.createdAt).toLocaleString()}</div>
                            </div>
                            
                            <div class="field">
                                <div class="label">🆔 Project ID:</div>
                                <div class="value" style="font-family: monospace; font-size: 12px;">${project.id}</div>
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p>✅ This is an automated email from your Portfolio System</p>
                            <p>© Vishwash Tak Portfolio • All rights reserved</p>
                        </div>
                    </div>
                </body>
            </html>
        `;

        const mailOptions = {
            from: EMAIL_USER,
            to: RECIPIENT_EMAIL,
            subject: `🎉 New Project Added: ${project.title}`,
            html: htmlContent,
            text: `New Project: ${project.title}\n\nDescription: ${project.description}\n\nLink: ${project.link || 'N/A'}\n\nTechnologies: ${project.technologies?.join(', ') || 'N/A'}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('❌ Error sending email:', error);
            } else {
                console.log('✅ Email sent successfully:', info.response);
            }
        });

        return true;
    } catch (error) {
        console.error('❌ Error in sendProjectNotification:', error);
        return false;
    }
}

// GET all projects
app.get('/api/projects', (req, res) => {
    const projects = getProjects();
    res.json({ success: true, projects });
});

// GET single project
app.get('/api/projects/:id', (req, res) => {
    const projects = getProjects();
    const project = projects.find(p => p.id === req.params.id);
    
    if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    res.json({ success: true, project });
});

// CREATE new project
app.post('/api/projects', (req, res) => {
    try {
        const { title, description, link, images, technologies, featured } = req.body;
        
        if (!title || !description || !images || images.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Title, description, and images are required' 
            });
        }
        
        const projects = getProjects();
        
        const newProject = {
            id: 'project_' + Date.now(),
            title,
            description,
            link: link || null,
            images,
            technologies: technologies || [],
            featured: featured || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        projects.push(newProject);
        
        if (saveProjects(projects)) {
            // Send email notification
            sendProjectNotification(newProject);
            
            console.log(`\n📂 NEW PROJECT ADDED:\n Title: ${title}\n Created: ${new Date().toLocaleString()}\n`);
            
            res.status(201).json({ 
                success: true, 
                message: 'Project added successfully and email notification sent',
                project: newProject 
            });
        } else {
            res.status(500).json({ success: false, message: 'Error saving project' });
        }
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// UPDATE project
app.put('/api/projects/:id', (req, res) => {
    try {
        const { title, description, link, images, technologies, featured } = req.body;
        
        let projects = getProjects();
        const projectIndex = projects.findIndex(p => p.id === req.params.id);
        
        if (projectIndex === -1) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        
        projects[projectIndex] = {
            ...projects[projectIndex],
            title: title || projects[projectIndex].title,
            description: description || projects[projectIndex].description,
            link: link !== undefined ? link : projects[projectIndex].link,
            images: images || projects[projectIndex].images,
            technologies: technologies || projects[projectIndex].technologies,
            featured: featured !== undefined ? featured : projects[projectIndex].featured,
            updatedAt: new Date().toISOString()
        };
        
        if (saveProjects(projects)) {
            res.json({ 
                success: true, 
                message: 'Project updated successfully',
                project: projects[projectIndex]
            });
        } else {
            res.status(500).json({ success: false, message: 'Error saving project' });
        }
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE project
app.delete('/api/projects/:id', (req, res) => {
    try {
        let projects = getProjects();
        const projectIndex = projects.findIndex(p => p.id === req.params.id);
        
        if (projectIndex === -1) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        
        const deletedProject = projects[projectIndex];
        projects.splice(projectIndex, 1);
        
        if (saveProjects(projects)) {
            res.json({ 
                success: true, 
                message: 'Project deleted successfully',
                project: deletedProject
            });
        } else {
            res.status(500).json({ success: false, message: 'Error saving project' });
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
initDatabase();

// CONTACT FORM SUBMISSION
app.post('/api/contact', (req, res) => {
    try {
        const { name, email, subject, message, timestamp } = req.body;
        
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }
        
        // Save contact submission to file
        const contactFile = path.join(__dirname, 'contacts.json');
        let contacts = [];
        
        if (fs.existsSync(contactFile)) {
            const data = fs.readFileSync(contactFile, 'utf8');
            contacts = JSON.parse(data);
        }
        
        contacts.push({
            id: 'contact_' + Date.now(),
            name,
            email,
            subject,
            message,
            timestamp,
            read: false
        });
        
        fs.writeFileSync(contactFile, JSON.stringify(contacts, null, 2));
        
        // Log to console
        console.log(`\n📧 NEW CONTACT MESSAGE:\n From: ${name} <${email}>\n Subject: ${subject}\n`);
        
        res.json({ 
            success: true, 
            message: 'Contact message received successfully'
        });
    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// VISITOR TRACKING
app.post('/api/visitors', (req, res) => {
    try {
        const { page, userAgent, referrer, timestamp } = req.body;
        
        // Get client IP
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // Save visitor data to file
        const visitorsFile = path.join(__dirname, 'visitors.json');
        let visitors = [];
        
        if (fs.existsSync(visitorsFile)) {
            const data = fs.readFileSync(visitorsFile, 'utf8');
            visitors = JSON.parse(data);
        }
        
        visitors.push({
            id: 'visitor_' + Date.now(),
            ip: clientIp,
            page: page || 'unknown',
            userAgent: userAgent || 'unknown',
            referrer: referrer || 'direct',
            timestamp: timestamp || new Date().toISOString(),
            visitedAt: new Date().toLocaleString()
        });
        
        fs.writeFileSync(visitorsFile, JSON.stringify(visitors, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Visitor tracked successfully'
        });
    } catch (error) {
        console.error('Error tracking visitor:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET visitors analytics
app.get('/api/visitors', (req, res) => {
    try {
        const visitorsFile = path.join(__dirname, 'visitors.json');
        
        if (!fs.existsSync(visitorsFile)) {
            return res.json({ success: true, visitors: [], total: 0 });
        }
        
        const data = fs.readFileSync(visitorsFile, 'utf8');
        const visitors = JSON.parse(data);
        
        // Calculate analytics
        const uniqueIps = new Set(visitors.map(v => v.ip));
        const pageViews = {};
        
        visitors.forEach(v => {
            pageViews[v.page] = (pageViews[v.page] || 0) + 1;
        });
        
        res.json({ 
            success: true, 
            visitors: visitors,
            totalVisits: visitors.length,
            uniqueVisitors: uniqueIps.size,
            pageViews: pageViews
        });
    } catch (error) {
        console.error('Error fetching visitors:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║ 🚀 PORTFOLIO SERVER RUNNING                      ║
║  Port: ${PORT}                                   ║
║  Database: projects-db.json                      ║
║  Contacts: contacts.json                         ║
║  Visitors: visitors.json                         ║
║  API: http://localhost:${PORT}/api/projects      ║
║  Tracking: http://localhost:${PORT}/api/visitors ║
╚══════════════════════════════════════════════════╝
    `);
});
