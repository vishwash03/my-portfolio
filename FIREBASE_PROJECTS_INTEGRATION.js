/**
 * Projects Page Integration
 * How to update projects.html to use Firebase with real-time sync
 * 
 * ⚠️ CRITICAL:
 * - Use images that load correctly on deployed website
 * - Do not use local file system paths
 * - Use relative paths (./images/...) or hosted image URLs
 */

// ============================================================================
// 1️⃣ REPLACE localStorage PROJECT LOADING WITH FIREBASE REAL-TIME LISTENER
// ============================================================================

// OLD CODE (localStorage):
/*
let projects = [];
function loadProjects() {
  try {
    const stored = localStorage.getItem('portfolio_projects');
    projects = stored ? JSON.parse(stored) : [];
  } catch (error) {
    projects = [];
  }
  renderProjects();
}
*/

// NEW CODE (Firebase real-time):
import { projectService } from './firebase-project-service.js';

let projects = [];
let unsubscribe = null;

async function initializeProjects() {
  try {
    // Set up real-time listener - gets instant updates
    unsubscribe = projectService.onProjectsUpdate((updatedProjects) => {
      projects = updatedProjects;
      console.log(`✅ Projects updated: ${projects.length} projects`);
      renderProjects();
    });

    // Initial load
    projects = await projectService.getAllProjects();
    renderProjects();
  } catch (error) {
    console.error('❌ Error initializing projects:', error);
  }
}

// Call on page load
document.addEventListener('DOMContentLoaded', initializeProjects);

// Cleanup when leaving page
window.addEventListener('beforeunload', () => {
  if (unsubscribe) {
    unsubscribe();
  }
});

// ============================================================================
// 2️⃣ UPDATE PROJECT CARD RENDERING
// ============================================================================

function renderProjects() {
  const projectsContainer = document.getElementById('projects-container');
  if (!projectsContainer) return;

  projectsContainer.innerHTML = projects.map(project => createProjectCard(project)).join('');
}

function createProjectCard(project) {
  return `
    <div class="project-card" data-project-id="${project.id}">
      <!-- Image Gallery -->
      <div class="project-images">
        ${project.images?.length ? `
          <img 
            src="${project.images[0]}" 
            alt="${project.title}"
            class="project-main-image"
            onerror="this.src='./images/placeholder.png'"
          />
          ${project.images.length > 1 ? `
            <div class="project-thumbnail-gallery">
              ${project.images.map((img, idx) => `
                <img 
                  src="${img}" 
                  alt="project image ${idx + 1}"
                  class="thumbnail"
                  onclick="showProjectDetail('${project.id}')"
                  onerror="this.src='./images/placeholder.png'"
                />
              `).join('')}
            </div>
          ` : ''}
        ` : `<div class="no-image">No image</div>`}
      </div>

      <!-- Project Info -->
      <h3 class="project-title">${project.title}</h3>
      <p class="project-description">${project.description}</p>

      <!-- Technologies -->
      <div class="tech-stack">
        ${project.technologies?.map(tech => `
          <span class="tech-tag">${tech}</span>
        `).join('') || '<span class="tech-tag">No tech info</span>'}
      </div>

      <!-- Links -->
      <div class="project-links">
        ${project.liveUrl ? `
          <a href="${project.liveUrl}" target="_blank" class="btn btn-primary">
            Live Demo
          </a>
        ` : ''}
        ${project.githubUrl ? `
          <a href="${project.githubUrl}" target="_blank" class="btn btn-secondary">
            GitHub
          </a>
        ` : ''}
      </div>
    </div>
  `;
}

// ============================================================================
// 3️⃣ PROJECT DETAIL PAGE LINK
// ============================================================================

async function showProjectDetail(projectId) {
  try {
    const project = await projectService.getProjectById(projectId);
    if (project) {
      // Option A: Open as modal
      showProjectModal(project);
      
      // Option B: Navigate to detail page
      // window.location.href = `/project-detail.html?id=${projectId}`;
    }
  } catch (error) {
    console.error('❌ Error loading project details:', error);
  }
}

function showProjectModal(project) {
  const modal = createProjectModal(project);
  document.body.appendChild(modal);
  modal.querySelector('.close-btn')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

function createProjectModal(project) {
  const modal = document.createElement('div');
  modal.className = 'project-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="close-btn">&times;</button>
      <h2>${project.title}</h2>
      <div class="modal-images">
        ${project.images?.map(img => `
          <img src="${img}" alt="${project.title}" onerror="this.src='./images/placeholder.png'" />
        `).join('') || '<p>No images</p>'}
      </div>
      <p>${project.description}</p>
      <div class="tech-stack">
        ${project.technologies?.map(tech => `<span>${tech}</span>`).join('')}
      </div>
      <div class="project-links">
        ${project.liveUrl ? `<a href="${project.liveUrl}" target="_blank" class="btn">Live</a>` : ''}
        ${project.githubUrl ? `<a href="${project.githubUrl}" target="_blank" class="btn">GitHub</a>` : ''}
      </div>
    </div>
  `;
  return modal;
}

// ============================================================================
// 4️⃣ SEARCH & FILTER (Optional but good UX)
// ============================================================================

function filterByTechnology(technology) {
  if (technology === 'all') {
    renderProjects();
  } else {
    const filtered = projects.filter(p => 
      p.technologies?.includes(technology)
    );
    
    const projectsContainer = document.getElementById('projects-container');
    projectsContainer.innerHTML = filtered.map(createProjectCard).join('');
  }
}

function searchProjects(searchTerm) {
  const search = searchTerm.toLowerCase();
  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(search) ||
    p.description.toLowerCase().includes(search) ||
    p.technologies?.some(t => t.toLowerCase().includes(search))
  );

  const projectsContainer = document.getElementById('projects-container');
  projectsContainer.innerHTML = filtered.map(createProjectCard).join('');
}

// ============================================================================
// USAGE IN HTML:
// ============================================================================
/*
<html>
<head>
  <!-- Include Firebase config first -->
  <script type="module">
    import { firebase-config.js }
    import { projectService } from './firebase-project-service.js';
  </script>
</head>
<body>
  <!-- Search/Filter UI -->
  <div class="projects-toolbar">
    <input 
      type="text" 
      id="search" 
      placeholder="Search projects..."
      onchange="searchProjects(this.value)"
    />
  </div>

  <!-- Projects Container -->
  <div id="projects-container" class="projects-grid">
    <!-- Populated by JavaScript -->
  </div>

  <!-- Include this script at the end -->
  <script type="module" src="./projects-firebase.js"></script>
</body>
</html>
*/
