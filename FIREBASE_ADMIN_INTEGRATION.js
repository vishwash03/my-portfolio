/**
 * Admin Panel Integration with Firebase
 * How to update admin-add-project.html to use cloud storage
 * 
 * ⚠️ CRITICAL:
 * - All projects added here must appear on ALL devices immediately
 * - Images must use correct paths (relative or hosted URLs)
 * - This must work on a live deployed website, not only locally
 */

import { projectService } from './firebase-project-service.js';
import { auth } from './firebase-config.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

const storage = getStorage();

// ============================================================================
// 1️⃣ ADMIN AUTHENTICATION & AUTHORIZATION
// ============================================================================

let isAdminUser = false;

async function checkAdminStatus() {
  try {
    isAdminUser = await projectService.isAdminLoggedIn();
    
    if (isAdminUser) {
      console.log('✅ Admin user authenticated');
      enableAdminPanel();
    } else {
      console.log('❌ Admin access denied');
      disableAdminPanel();
      window.location.href = 'admin-unlock.html';
    }
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
    window.location.href = 'admin-unlock.html';
  }
}

// ============================================================================
// 2️⃣ ADD PROJECT FORM SUBMISSION
// ============================================================================

async function handleAddProject(event) {
  event.preventDefault();

  if (!isAdminUser) {
    alert('❌ Admin access required');
    return;
  }

  const formData = new FormData(event.target);
  
  try {
    // Show loading state
    showLoading('Adding project...');

    // Collect form data
    const projectData = {
      title: formData.get('title'),
      description: formData.get('description'),
      technologies: formData.get('technologies')
        .split(',')
        .map(t => t.trim())
        .filter(t => t),
      liveUrl: formData.get('liveUrl'),
      githubUrl: formData.get('githubUrl'),
      featured: formData.get('featured') === 'on',
      category: formData.get('category')
    };

    // Handle images
    const imageFiles = formData.getAll('projectImages');
    projectData.images = await uploadProjectImages(imageFiles);

    // Add project to Firestore
    const project = await projectService.addProject(projectData);
    
    showSuccess(`✅ Project "${project.title}" added successfully!`);
    event.target.reset();

    // Optional: Show the project was added
    setTimeout(() => {
      location.reload(); // Refresh to show in list
    }, 2000);

  } catch (error) {
    console.error('❌ Error adding project:', error);
    showError(`Failed to add project: ${error.message}`);
  }
}

// ============================================================================
// 3️⃣ IMAGE UPLOAD TO FIREBASE STORAGE
// ============================================================================

/**
 * Upload project images to Firebase Storage
 * Returns URLs that work on live website
 */
async function uploadProjectImages(files) {
  const imageUrls = [];

  for (const file of files) {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error(`Invalid file type: ${file.name}`);
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error(`File too large: ${file.name} (max 5MB)`);
      }

      // Create storage reference
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `project-images/${fileName}`);

      // Upload file
      console.log(`📤 Uploading ${file.name}...`);
      await uploadBytes(storageRef, file);

      // Get download URL (works on live website)
      const url = await getDownloadURL(storageRef);
      imageUrls.push(url);
      console.log(`✅ Uploaded: ${url}`);

    } catch (error) {
      console.error(`❌ Error uploading ${file.name}:`, error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  return imageUrls;
}

// ============================================================================
// 4️⃣ EDIT PROJECT
// ============================================================================

async function handleEditProject(projectId, event) {
  event.preventDefault();

  if (!isAdminUser) {
    alert('❌ Admin access required');
    return;
  }

  try {
    showLoading('Updating project...');

    const formData = new FormData(event.target);
    
    const projectData = {
      title: formData.get('title'),
      description: formData.get('description'),
      technologies: formData.get('technologies')
        .split(',')
        .map(t => t.trim())
        .filter(t => t),
      liveUrl: formData.get('liveUrl'),
      githubUrl: formData.get('githubUrl'),
      featured: formData.get('featured') === 'on'
    };

    // Handle new images if uploaded
    const newImageFiles = formData.getAll('projectImages');
    if (newImageFiles.length > 0) {
      projectData.images = await uploadProjectImages(newImageFiles);
    }

    // Update project in Firestore
    const updated = await projectService.updateProject(projectId, projectData);
    
    showSuccess(`✅ Project "${updated.title}" updated successfully!`);

    setTimeout(() => {
      location.reload();
    }, 2000);

  } catch (error) {
    console.error('❌ Error updating project:', error);
    showError(`Failed to update project: ${error.message}`);
  }
}

// ============================================================================
// 5️⃣ DELETE PROJECT
// ============================================================================

async function handleDeleteProject(projectId, projectTitle) {
  if (!isAdminUser) {
    alert('❌ Admin access required');
    return;
  }

  if (!confirm(`Delete project "${projectTitle}"?\n\nThis action cannot be undone.`)) {
    return;
  }

  try {
    showLoading('Deleting project...');
    
    await projectService.deleteProject(projectId);
    
    showSuccess(`✅ Project deleted successfully!`);

    setTimeout(() => {
      location.reload();
    }, 2000);

  } catch (error) {
    console.error('❌ Error deleting project:', error);
    showError(`Failed to delete project: ${error.message}`);
  }
}

// ============================================================================
// 6️⃣ LOAD & DISPLAY PROJECTS IN ADMIN TABLE
// ============================================================================

let adminProjects = [];
let unsubscribe = null;

async function loadAdminProjects() {
  try {
    // Real-time listener for admin
    unsubscribe = projectService.onProjectsUpdate((projects) => {
      adminProjects = projects;
      renderProjectsTable();
      console.log(`✅ Admin projects refreshed: ${projects.length}`);
    });

    // Initial load
    adminProjects = await projectService.getAllProjects();
    renderProjectsTable();

  } catch (error) {
    console.error('❌ Error loading admin projects:', error);
  }
}

function renderProjectsTable() {
  const tableBody = document.getElementById('projects-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = adminProjects.map(project => `
    <tr>
      <td>${project.title}</td>
      <td>${project.technologies?.join(', ') || 'N/A'}</td>
      <td>${project.images?.length || 0}</td>
      <td>${project.featured ? '✅ Yes' : 'No'}</td>
      <td class="actions">
        <button class="btn-edit" onclick="editProject('${project.id}')">
          Edit
        </button>
        <button class="btn-delete" onclick="handleDeleteProject('${project.id}', '${project.title}')">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

// ============================================================================
// 7️⃣ IMPORT/EXPORT FUNCTIONALITY
// ============================================================================

async function handleExportProjects() {
  if (!isAdminUser) {
    alert('❌ Admin access required');
    return;
  }

  try {
    const projects = await projectService.exportProjects();
    
    // Create JSON file
    const json = JSON.stringify(projects, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showSuccess(`✅ Exported ${projects.length} projects`);
  } catch (error) {
    console.error('❌ Error exporting projects:', error);
    showError(`Failed to export: ${error.message}`);
  }
}

async function handleImportProjects(event) {
  if (!isAdminUser) {
    alert('❌ Admin access required');
    return;
  }

  const file = event.target.files[0];
  if (!file) return;

  try {
    showLoading('Importing projects...');

    const json = await file.text();
    const projects = JSON.parse(json);

    if (!Array.isArray(projects)) {
      throw new Error('Invalid file format: must be an array');
    }

    const imported = await projectService.importProjects(projects);
    
    showSuccess(`✅ Imported ${imported.length} projects`);
    
    setTimeout(() => {
      location.reload();
    }, 2000);

  } catch (error) {
    console.error('❌ Error importing projects:', error);
    showError(`Failed to import: ${error.message}`);
  }
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

function showLoading(message) {
  const loader = document.getElementById('loader') || createLoader();
  loader.textContent = message;
  loader.style.display = 'flex';
}

function createLoader() {
  const loader = document.createElement('div');
  loader.id = 'loader';
  loader.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 20px 40px;
    border-radius: 8px;
    z-index: 9999;
    display: none;
  `;
  document.body.appendChild(loader);
  return loader;
}

function showSuccess(message) {
  const notification = createNotification(message, 'success');
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function showError(message) {
  const notification = createNotification(message, 'error');
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}

function createNotification(message, type) {
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  el.textContent = message;
  return el;
}

function disableAdminPanel() {
  const form = document.getElementById('add-project-form');
  if (form) form.style.display = 'none';
  
  const message = document.createElement('div');
  message.textContent = '❌ You are not authorized to access the admin panel';
  message.style.padding = '20px';
  message.style.color = '#ef4444';
  document.body.prepend(message);
}

function enableAdminPanel() {
  console.log('✅ Admin panel enabled');
}

// ============================================================================
// INITIALIZE ON PAGE LOAD
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  await checkAdminStatus();
  await loadAdminProjects();

  // Attach event listeners
  const form = document.getElementById('add-project-form');
  if (form) {
    form.addEventListener('submit', handleAddProject);
  }

  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', handleExportProjects);
  }

  const importInput = document.getElementById('import-file');
  if (importInput) {
    importInput.addEventListener('change', handleImportProjects);
  }
});

// Cleanup when leaving
window.addEventListener('beforeunload', () => {
  if (unsubscribe) {
    unsubscribe();
  }
});
