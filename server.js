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

        // Validate and optimize images
        let processedImages = [];
        for (let image of images) {
            // Handle both base64 and URL formats
            if (image && typeof image === 'string') {
                // Validate base64 image size (max 5MB per image)
                const imageSizeInBytes = image.length * 0.75; // Approximate base64 to bytes
                if (imageSizeInBytes > 5 * 1024 * 1024) {
                    console.warn(`Image exceeds 5MB limit, size: ${(imageSizeInBytes / 1024 / 1024).toFixed(2)}MB`);
                    continue;
                }
                
                // Ensure image has proper data URI format
                if (!image.startsWith('data:image/')) {
                    image = 'data:image/jpeg;base64,' + image;
                }
                
                processedImages.push(image);
            }
        }

        if (processedImages.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No valid images provided' 
            });
        }

        const projects = getProjects();
        
        const newProject = {
            id: 'project_' + Date.now(),
            title: title.trim(),
            description: description.trim(),
            link: link && link.trim() ? link.trim() : null,
            images: processedImages,
            technologies: (technologies || []).filter(t => t && t.trim()),
            featured: featured || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        projects.push(newProject);
        
        if (saveProjects(projects)) {
            // Send email notification
            sendProjectNotification(newProject);
            
            console.log(`\n📂 NEW PROJECT ADDED:\n Title: ${title}\n Images: ${processedImages.length}\n Created: ${new Date().toLocaleString()}\n`);
            
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
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
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

// ===== DEVICE DETECTION =====
function getDeviceType(userAgent) {
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua)) {
        return 'mobile';
    } else if (/tablet|ipad|kindle|playbook|silk|nexus 7|nexus 10|xoom/.test(ua)) {
        return 'tablet';
    }
    return 'desktop';
}

function getOS(userAgent) {
    const ua = userAgent.toLowerCase();
    if (/windows/.test(ua)) return 'Windows';
    else if (/macintosh|macos|mac os/.test(ua)) return 'macOS';
    else if (/linux/.test(ua)) return 'Linux';
    else if (/iphone|ipad|ipod/.test(ua)) return 'iOS';
    else if (/android/.test(ua)) return 'Android';
    return 'Unknown';
}

function getBrowser(userAgent) {
    const ua = userAgent.toLowerCase();
    if (/edge/.test(ua)) return 'Edge';
    else if (/chrome/.test(ua) && !/chromium|edg|brave/.test(ua)) return 'Chrome';
    else if (/firefox/.test(ua)) return 'Firefox';
    else if (/safari/.test(ua) && !/chrome|crios/.test(ua)) return 'Safari';
    else if (/trident|msie/.test(ua)) return 'IE';
    else if (/opera|opr/.test(ua)) return 'Opera';
    return 'Unknown';
}

// VISITOR TRACKING (Advanced with Device Detection)
app.post('/api/visitors', (req, res) => {
    try {
        const { 
            page, 
            userAgent, 
            referrer, 
            timestamp,
            deviceType,
            os,
            browser,
            screenSize,
            screenResolution,
            country,
            city,
            ip,
            timezone,
            isp,
            language,
            connection,
            sessionId
        } = req.body;
        
        // Get client IP from request if not provided
        const clientIp = ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // Detect device info from userAgent if not provided
        const detectedDeviceType = deviceType || getDeviceType(userAgent || '');
        const detectedOS = os || getOS(userAgent || '');
        const detectedBrowser = browser || getBrowser(userAgent || '');
        
        // Save visitor data to file
        const visitorsFile = path.join(__dirname, 'visitors.json');
        let visitors = [];
        
        if (fs.existsSync(visitorsFile)) {
            const data = fs.readFileSync(visitorsFile, 'utf8');
            visitors = JSON.parse(data);
        }
        
        const visitorEntry = {
            id: 'visitor_' + Date.now(),
            ip: clientIp,
            page: page || 'unknown',
            userAgent: userAgent || 'unknown',
            referrer: referrer || 'direct',
            timestamp: timestamp || new Date().toISOString(),
            sessionId: sessionId || 'session_' + Date.now(),
            
            // Device Info
            deviceType: detectedDeviceType,
            os: detectedOS,
            browser: detectedBrowser,
            screenSize: screenSize || 'unknown',
            screenResolution: screenResolution || 'unknown',
            
            // Location Info
            country: country || 'Unknown',
            city: city || 'Unknown',
            timezone: timezone || 'Unknown',
            isp: isp || 'Unknown',
            
            // Additional Info
            language: language || navigator?.language || 'unknown',
            connection: connection || 'unknown',
            
            visitedAt: new Date().toLocaleString()
        };
        
        // Limit visitors.json to last 10,000 records to prevent file bloat
        if (visitors.length > 10000) {
            visitors = visitors.slice(-9999);
        }
        
        visitors.push(visitorEntry);
        
        fs.writeFileSync(visitorsFile, JSON.stringify(visitors, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Visitor tracked successfully',
            visitorId: visitorEntry.id
        });
    } catch (error) {
        console.error('Error tracking visitor:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET visitors analytics (Enhanced)
app.get('/api/visitors', (req, res) => {
    try {
        const visitorsFile = path.join(__dirname, 'visitors.json');
        
        if (!fs.existsSync(visitorsFile)) {
            return res.json({ 
                success: true, 
                visitors: [], 
                total: 0,
                analytics: {
                    totalVisits: 0,
                    uniqueVisitors: 0,
                    pageViews: {},
                    deviceBreakdown: {},
                    osBreakdown: {},
                    browserBreakdown: {},
                    topCountries: {},
                    topCities: {}
                }
            });
        }
        
        const data = fs.readFileSync(visitorsFile, 'utf8');
        const visitors = JSON.parse(data);
        
        // Calculate analytics
        const uniqueIps = new Set(visitors.map(v => v.ip));
        const uniqueSessions = new Set(visitors.map(v => v.sessionId));
        
        const pageViews = {};
        const deviceBreakdown = {};
        const osBreakdown = {};
        const browserBreakdown = {};
        const topCountries = {};
        const topCities = {};
        
        visitors.forEach(v => {
            // Page views
            pageViews[v.page] = (pageViews[v.page] || 0) + 1;
            
            // Device breakdown
            deviceBreakdown[v.deviceType] = (deviceBreakdown[v.deviceType] || 0) + 1;
            
            // OS breakdown
            osBreakdown[v.os] = (osBreakdown[v.os] || 0) + 1;
            
            // Browser breakdown
            browserBreakdown[v.browser] = (browserBreakdown[v.browser] || 0) + 1;
            
            // Top countries
            if (v.country !== 'Unknown') {
                topCountries[v.country] = (topCountries[v.country] || 0) + 1;
            }
            
            // Top cities
            if (v.city !== 'Unknown') {
                topCities[v.city] = (topCities[v.city] || 0) + 1;
            }
        });
        
        res.json({ 
            success: true, 
            visitors: visitors.slice(-100), // Return last 100 visitors
            total: visitors.length,
            analytics: {
                totalVisits: visitors.length,
                uniqueVisitors: uniqueIps.size,
                uniqueSessions: uniqueSessions.size,
                pageViews: pageViews,
                deviceBreakdown: deviceBreakdown,
                osBreakdown: osBreakdown,
                browserBreakdown: browserBreakdown,
                topCountries: topCountries,
                topCities: topCities
            }
        });
    } catch (error) {
        console.error('Error fetching visitors:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET real-time visitors (last 30 minutes)
app.get('/api/visitors/realtime', (req, res) => {
    try {
        const visitorsFile = path.join(__dirname, 'visitors.json');
        
        if (!fs.existsSync(visitorsFile)) {
            return res.json({ success: true, realtimeVisitors: [] });
        }
        
        const data = fs.readFileSync(visitorsFile, 'utf8');
        const allVisitors = JSON.parse(data);
        
        // Get visitors from last 30 minutes
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const realtimeVisitors = allVisitors.filter(v => {
            const visitDate = new Date(v.timestamp);
            return visitDate > thirtyMinutesAgo;
        });
        
        res.json({ 
            success: true,
            realtimeVisitors: realtimeVisitors.reverse(),
            totalRealtimeVisitors: realtimeVisitors.length
        });
    } catch (error) {
        console.error('Error fetching realtime visitors:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DEVICE DETECTION ENDPOINT
app.get('/api/device-detect', (req, res) => {
    try {
        const userAgent = req.headers['user-agent'] || '';
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        const deviceInfo = {
            deviceType: getDeviceType(userAgent),
            os: getOS(userAgent),
            browser: getBrowser(userAgent),
            userAgent: userAgent,
            clientIp: clientIp,
            timestamp: new Date().toISOString()
        };
        
        res.json({
            success: true,
            device: deviceInfo
        });
    } catch (error) {
        console.error('Error detecting device:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// IMAGE PROXY ENDPOINT - Serve images with device-aware optimization
app.get('/api/image/:projectId/:imageIndex', (req, res) => {
    try {
        const { projectId, imageIndex } = req.params;
        const projects = getProjects();
        const project = projects.find(p => p.id === projectId);
        
        if (!project || !project.images || !project.images[imageIndex]) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }
        
        const imageData = project.images[imageIndex];
        
        // Detect device type for optimization
        const userAgent = req.headers['user-agent'] || '';
        const deviceType = getDeviceType(userAgent);
        
        // Return image with appropriate headers
        if (imageData.startsWith('data:')) {
            // Data URI - convert and send
            const [header, data] = imageData.split(',');
            const mimeType = header.match(/data:([^;]+)/)[1];
            const buffer = Buffer.from(data, 'base64');
            
            res.set('Content-Type', mimeType);
            res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
            res.set('X-Device-Type', deviceType);
            res.send(buffer);
        } else {
            // Already formatted URL or base64
            res.json({
                success: true,
                imageUrl: imageData,
                deviceType: deviceType,
                projectId: projectId
            });
        }
    } catch (error) {
        console.error('Error serving image:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// IMAGE VALIDATION ENDPOINT - Check if image exists and is accessible
app.head('/api/image/:projectId/:imageIndex', (req, res) => {
    try {
        const { projectId, imageIndex } = req.params;
        const projects = getProjects();
        const project = projects.find(p => p.id === projectId);
        
        if (project && project.images && project.images[imageIndex]) {
            res.set('X-Image-Exists', 'true');
            res.status(200).end();
        } else {
            res.status(404).end();
        }
    } catch (error) {
        res.status(500).end();
    }
});

// IMAGE FALLBACK ENDPOINT - Get first available image if specific one fails
app.get('/api/image/:projectId/fallback', (req, res) => {
    try {
        const { projectId } = req.params;
        const projects = getProjects();
        const project = projects.find(p => p.id === projectId);
        
        if (!project || !project.images || project.images.length === 0) {
            return res.status(404).json({ success: false, message: 'No images available' });
        }
        
        const imageData = project.images[0];
        
        if (imageData.startsWith('data:')) {
            const [header, data] = imageData.split(',');
            const mimeType = header.match(/data:([^;]+)/)[1];
            const buffer = Buffer.from(data, 'base64');
            
            res.set('Content-Type', mimeType);
            res.set('Cache-Control', 'public, max-age=86400');
            res.send(buffer);
        } else {
            res.json({
                success: true,
                imageUrl: imageData,
                projectId: projectId
            });
        }
    } catch (error) {
        console.error('Error serving fallback image:', error);
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
║  Images: http://localhost:${PORT}/api/image/*    ║
║  Tracking: http://localhost:${PORT}/api/visitors ║
╚══════════════════════════════════════════════════╝
    `);
});
