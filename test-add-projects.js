/**
 * Test Script - Add Sample Projects to Firebase
 * Run: node test-add-projects.js
 */

const https = require('https');

// Firebase REST API endpoint for adding documents
const FIREBASE_PROJECT_ID = 'portfolio-projects-a9c81';
const API_KEY = 'AIzaSyC0GXFjV26AcgDParpZWof5gVCtDaWhidw';

const sampleProjects = [
  {
    title: 'SlayLink - URL Shortener',
    description: 'A modern URL shortening service with analytics and custom domains. Built with Next.js and PostgreSQL.',
    link: 'https://github.com/example/slaylink',
    technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Tailwind'],
    images: ['https://via.placeholder.com/400x300?text=SlayLink+URL+Shortener'],
    featured: true,
    createdAt: new Date().toISOString(),
    website: 'https://slaylink.example.com'
  },
  {
    title: 'Asopalav - E-Commerce Platform',
    description: 'Full-stack e-commerce platform with payment integration, inventory management, and admin dashboard.',
    link: 'https://github.com/example/asopalav',
    technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
    images: ['https://via.placeholder.com/400x300?text=Asopalav+E-Commerce'],
    featured: true,
    createdAt: new Date().toISOString(),
    website: 'https://asopalav.example.com'
  },
  {
    title: 'Outflow - Expense Tracker',
    description: 'Smart expense tracking app with budget planning, category management, and financial insights. Mobile-first design.',
    link: 'https://github.com/example/outflow',
    technologies: ['React Native', 'Firebase', 'Redux', 'Charts.js'],
    images: ['https://via.placeholder.com/400x300?text=Outflow+Expense+Tracker'],
    featured: true,
    createdAt: new Date().toISOString(),
    website: 'https://outflow.example.com'
  },
  {
    title: 'PlaceAA - Travel Booking App',
    description: 'Comprehensive travel booking platform with real-time availability, pricing comparison, and user reviews.',
    link: 'https://github.com/example/placeaa',
    technologies: ['Vue.js', 'Express.js', 'PostgreSQL', 'Google Maps API'],
    images: ['https://via.placeholder.com/400x300?text=PlaceAA+Travel+Booking'],
    featured: true,
    createdAt: new Date().toISOString(),
    website: 'https://placeaa.example.com'
  }
];

async function addProject(project) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      fields: {
        title: { stringValue: project.title },
        description: { stringValue: project.description },
        link: { stringValue: project.link },
        website: { stringValue: project.website || '' },
        technologies: { arrayValue: { values: project.technologies.map(t => ({ stringValue: t })) } },
        images: { arrayValue: { values: project.images.map(i => ({ stringValue: i })) } },
        featured: { booleanValue: project.featured },
        createdAt: { timestampValue: project.createdAt }
      }
    });

    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/projects?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testProjects() {
  console.log('\n🧪 Testing Firebase Project Addition\n');
  console.log('━'.repeat(50));

  for (let i = 0; i < sampleProjects.length; i++) {
    const project = sampleProjects[i];
    try {
      console.log(`\n📝 Adding project ${i + 1}/${sampleProjects.length}: "${project.title}"`);
      const result = await addProject(project);
      console.log(`✅ Successfully added: ${project.title}`);
      console.log(`   📝 Doc ID: ${result.name?.split('/').pop()}`);
    } catch (error) {
      console.log(`❌ Failed to add "${project.title}"`);
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log('\n' + '━'.repeat(50));
  console.log('\n✅ Project addition test complete!');
  console.log('🌐 Visit: http://localhost:8000/projects.html to see the projects\n');
}

testProjects().catch(console.error);
