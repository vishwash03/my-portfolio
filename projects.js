/**
 * Projects Display Logic
 * Fetch and display projects on public website
 */

import { projectsService } from './firebase.js';

let allProjects = [];
let filteredProjects = [];
let currentFilter = 'all';
let currentImageIndex = {};

// Fallback sample projects
const SAMPLE_PROJECTS = [
  {
    id: "project_1",
    title: "E-Commerce Platform",
    description: "A full-featured e-commerce platform with product catalog, shopping cart, payment integration, and order management system. Built with modern technologies and responsive design.",
    link: "https://example.com/ecommerce",
    github: "https://github.com/example/ecommerce",
    images: ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%233b82f6' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='white' text-anchor='middle' dominant-baseline='middle'%3EE-Commerce%3C/text%3E%3C/svg%3E"],
    technologies: ["React", "Node.js", "MongoDB", "Stripe"],
    createdAt: "2024-01-15"
  },
  {
    id: "project_2",
    title: "Real-Time Chat Application",
    description: "A real-time messaging application with instant notifications, user authentication, group conversations, and media sharing capabilities.",
    link: "https://example.com/chat",
    github: "https://github.com/example/chat",
    images: ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%2310b981' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='white' text-anchor='middle' dominant-baseline='middle'%3EChat App%3C/text%3E%3C/svg%3E"],
    technologies: ["Socket.io", "Express", "React", "PostgreSQL"],
    createdAt: "2024-01-20"
  },
  {
    id: "project_3",
    title: "Task Management Dashboard",
    description: "Comprehensive task management tool with drag-and-drop interface, team collaboration features, real-time updates, and detailed analytics.",
    link: "https://example.com/tasks",
    github: "https://github.com/example/tasks",
    images: ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f59e0b' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='white' text-anchor='middle' dominant-baseline='middle'%3ETasks%3C/text%3E%3C/svg%3E"],
    technologies: ["Vue.js", "Django", "Redis", "MySQL"],
    createdAt: "2024-02-01"
  },
  {
    id: "project_4",
    title: "AI Content Generator",
    description: "Machine learning-powered content generation tool that creates blog posts, social media content, and product descriptions using advanced NLP models.",
    link: "https://example.com/ai-generator",
    github: "https://github.com/example/ai",
    images: ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%238b5cf6' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='white' text-anchor='middle' dominant-baseline='middle'%3EAI Generator%3C/text%3E%3C/svg%3E"],
    technologies: ["Python", "TensorFlow", "FastAPI", "React"],
    createdAt: "2024-02-10"
  }
];

// ===== LOAD PROJECTS =====
async function loadProjects() {
  try {
    console.log('Loading projects from Firebase...');
    allProjects = await projectsService.getAll();
    console.log('Projects loaded from Firebase:', allProjects.length);
    
    // Use sample projects if Firebase is empty
    if (!allProjects || allProjects.length === 0) {
      console.warn('⚠️ No projects in Firebase, using sample projects');
      allProjects = SAMPLE_PROJECTS;
    }
    
    displayProjects(allProjects);
    populateTechFilter();
    updateResultsCount(allProjects.length);
  } catch (error) {
    console.error('❌ Error loading projects:', error);
    // Use sample projects on error
    allProjects = SAMPLE_PROJECTS;
    displayProjects(allProjects);
    populateTechFilter();
    updateResultsCount(allProjects.length);
  }
}

// ===== DISPLAY PROJECTS =====
function displayProjects(projects) {
  const container = document.getElementById('projectsContainer');
  const emptyState = document.getElementById('emptyState');
  
  if (!container) {
    console.error('Container not found');
    return;
  }

  if (projects.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'block';
    updateResultsCount(0);
    return;
  }

  emptyState.style.display = 'none';

  container.innerHTML = projects.map((project, idx) => {
    const images = project.images && Array.isArray(project.images) ? project.images : [];
    const firstImage = images[0] || null;
    
    return `
      <div class="project-card" style="position: relative;" data-project-id="${project.id}">
        <div class="project-image-container" onclick="openImageModal('${project.id}')">
          ${firstImage ? `<img src="${firstImage}" alt="${project.title}" class="project-image">` : '<div class="project-image-placeholder">📷</div>'}
        </div>
        <div class="project-info">
          <h3 class="project-title">${project.title || 'Untitled'}</h3>
          <p class="project-desc">${project.description || 'No description'}</p>
          <div class="project-tech">
            ${(project.technologies || []).map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
          </div>
          <div class="project-actions">
            ${project.link ? `<a href="${project.link}" target="_blank" class="project-link">View Project</a>` : ''}
            ${project.github ? `<a href="${project.github}" target="_blank" class="project-link secondary">GitHub</a>` : ''}
          </div>
        </div>
        <div class="card-arrow">
          <svg fill="currentColor" viewBox="0 0 24 24"><path d="M6 6v2h8.59L5 17.59 6.41 19 16 9.41V18h2V6z"/></svg>
        </div>
      </div>
    `;
  }).join('');

  updateResultsCount(projects.length);
}

// ===== POPULATE TECH FILTER =====
function populateTechFilter() {
  const allTechs = new Set();
  allProjects.forEach(p => {
    (p.technologies || []).forEach(t => allTechs.add(t));
  });

  const techFilterSelect = document.getElementById('techFilter');
  if (!techFilterSelect) return;

  const currentValue = techFilterSelect.value;
  techFilterSelect.innerHTML = '<option value="">All Technologies</option>' +
    Array.from(allTechs).sort().map(tech => 
      `<option value="${tech}">${tech}</option>`
    ).join('');
  
  if (currentValue) {
    techFilterSelect.value = currentValue;
  }
}

// ===== UPDATE RESULTS COUNT =====
function updateResultsCount(count) {
  const resultsCount = document.getElementById('resultsCount');
  if (resultsCount) {
    resultsCount.textContent = count;
  }
}

// ===== SEARCH & FILTER =====
window.handleSearch = (query) => {
  filterAndDisplay();
};

window.handleTechFilter = (tech) => {
  filterAndDisplay();
};

function filterAndDisplay() {
  const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const techFilter = document.getElementById('techFilter')?.value || '';

  let results = allProjects;

  // Apply search filter
  if (searchQuery) {
    results = results.filter(p =>
      p.title.toLowerCase().includes(searchQuery) ||
      (p.description || '').toLowerCase().includes(searchQuery)
    );
  }

  // Apply tech filter
  if (techFilter) {
    results = results.filter(p =>
      (p.technologies || []).includes(techFilter)
    );
  }

  displayProjects(results);
}

// ===== IMAGE MODAL =====
window.openImageModal = (projectId) => {
  const project = allProjects.find(p => p.id === projectId);
  if (!project || !project.images || project.images.length === 0) return;

  currentImageIndex[projectId] = 0;
  showImage(projectId);
  document.getElementById('imageModal').classList.add('active');
};

window.closeImageModal = () => {
  document.getElementById('imageModal').classList.remove('active');
};

window.nextImage = () => {
  const modal = document.getElementById('imageModal');
  const img = document.getElementById('modalImage');
  const projectId = img.dataset.projectId;
  if (!projectId) return;

  const project = allProjects.find(p => p.id === projectId);
  if (!project || !project.images) return;

  currentImageIndex[projectId] = (currentImageIndex[projectId] + 1) % project.images.length;
  showImage(projectId);
};

window.previousImage = () => {
  const modal = document.getElementById('imageModal');
  const img = document.getElementById('modalImage');
  const projectId = img.dataset.projectId;
  if (!projectId) return;

  const project = allProjects.find(p => p.id === projectId);
  if (!project || !project.images) return;

  currentImageIndex[projectId] = (currentImageIndex[projectId] - 1 + project.images.length) % project.images.length;
  showImage(projectId);
};

function showImage(projectId) {
  const project = allProjects.find(p => p.id === projectId);
  if (!project || !project.images) return;

  const index = currentImageIndex[projectId] || 0;
  const img = document.getElementById('modalImage');
  img.src = project.images[index];
  img.dataset.projectId = projectId;
  img.alt = `${project.title} - Image ${index + 1}`;
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  const techFilter = document.getElementById('techFilter');
  if (techFilter) {
    techFilter.addEventListener('change', handleTechFilter);
  }

  loadProjects();
});

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  const modal = document.getElementById('imageModal');
  if (e.target === modal) {
    closeImageModal();
  }
});

console.log('✅ Projects module loaded');
