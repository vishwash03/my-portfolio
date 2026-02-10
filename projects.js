/**
 * Projects Display Logic
 * Fetch and display projects on public website
 */

import { projectsService } from './firebase.js';

let allProjects = [];
let filteredProjects = [];
let currentFilter = 'all';

// ===== LOAD PROJECTS =====
async function loadProjects() {
  try {
    allProjects = await projectsService.getAll();
    displayProjects(allProjects);
    populateFilters();
  } catch (error) {
    console.error('❌ Error loading projects:', error);
    document.getElementById('projectsContainer').innerHTML = '<p style="text-align: center; color: #aaa;">Error loading projects</p>';
  }
}

// ===== DISPLAY PROJECTS =====
function displayProjects(projects) {
  const container = document.getElementById('projectsContainer');
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #aaa;">No projects yet</p>';
    return;
  }

  container.innerHTML = projects.map(project => `
    <div class="project-card" style="position: relative;">
      <div class="project-images">
        ${project.images?.[0] ? `<img src="${project.images[0]}" alt="${project.title}" class="project-image">` : ''}
      </div>
      <div class="project-info">
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <div class="project-tech">
          ${(project.technologies || []).map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
        </div>
        ${project.link ? `<a href="${project.link}" target="_blank" class="btn">View Project →</a>` : ''}
      </div>
      <div class="card-arrow">
        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M6 6v2h8.59L5 17.59 6.41 19 16 9.41V18h2V6z"/></svg>
      </div>
    </div>
  `).join('');

  document.getElementById('projectCount').textContent = projects.length;
}

// ===== POPULATE FILTERS =====
function populateFilters() {
  const allTechs = new Set();
  allProjects.forEach(p => {
    (p.technologies || []).forEach(t => allTechs.add(t));
  });

  const filterContainer = document.getElementById('filterContainer');
  if (!filterContainer) return;

  filterContainer.innerHTML = `
    <button class="filter-btn active" onclick="filterProjects('all')">All Projects</button>
    ${Array.from(allTechs).map(tech => `
      <button class="filter-btn" onclick="filterProjects('${tech}')">${tech}</button>
    `).join('')}
  `;
}

// ===== FILTER PROJECTS =====
window.filterProjects = (tech) => {
  currentFilter = tech;

  // Update button states
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Filter projects
  if (tech === 'all') {
    displayProjects(allProjects);
  } else {
    filteredProjects = allProjects.filter(p => 
      (p.technologies || []).includes(tech)
    );
    displayProjects(filteredProjects);
  }
};

// ===== SEARCH PROJECTS =====
window.searchProjects = (query) => {
  if (!query) {
    displayProjects(allProjects);
    return;
  }

  const results = allProjects.filter(p =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase())
  );
  
  displayProjects(results);
};

// ===== SORT PROJECTS =====
window.sortProjects = (sortBy) => {
  let sorted = [...allProjects];

  if (sortBy === 'newest') {
    sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'oldest') {
    sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  displayProjects(sorted);
};

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', loadProjects);

console.log('✅ Projects module loaded');
