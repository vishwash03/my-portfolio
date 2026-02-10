/**
 * Admin Logic
 * Handle project management (add, edit, delete)
 */

import { projectsService, authService, storageService } from './firebase.js';

let currentUser = null;
let currentProjects = [];
let editingProjectId = null;
let selectedImages = [];

// ===== AUTH INITIALIZATION =====
authService.onAuthChange(async (user) => {
  currentUser = user;
  if (user) {
    console.log('✅ Admin logged in:', user.email);
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
    loadProjects();
  } else {
    console.log('❌ Not logged in');
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
  }
});

// ===== LOGIN =====
document.getElementById('loginBtn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;

  try {
    await authService.login(email, password);
  } catch (error) {
    alert('❌ Login failed: ' + error.message);
  }
});

// ===== LOGOUT =====
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  try {
    await authService.logout();
  } catch (error) {
    alert('❌ Logout failed: ' + error.message);
  }
});

// ===== LOAD PROJECTS =====
async function loadProjects() {
  currentProjects = await projectsService.getAll();
  displayProjects();
}

// ===== DISPLAY PROJECTS TABLE =====
function displayProjects() {
  const tbody = document.getElementById('projectsTableBody');
  if (!tbody) return;

  if (currentProjects.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #aaa;">No projects yet</td></tr>';
    return;
  }

  tbody.innerHTML = currentProjects.map(p => `
    <tr>
      <td>${p.title}</td>
      <td>${p.technologies?.join(', ') || 'N/A'}</td>
      <td>${p.images?.length || 0} images</td>
      <td>
        <button class="btn-small" onclick="editProject('${p.id}')">Edit</button>
        <button class="btn-small btn-danger" onclick="deleteProject('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

// ===== EDIT PROJECT =====
window.editProject = async (id) => {
  editingProjectId = id;
  const project = await projectsService.getById(id);
  
  if (project) {
    document.getElementById('projectTitle').value = project.title;
    document.getElementById('projectDesc').value = project.description;
    document.getElementById('projectLink').value = project.link || '';
    document.getElementById('projectTech').value = (project.technologies || []).join(', ');
    selectedImages = [...(project.images || [])];
    
    document.getElementById('projectModal').classList.add('active');
  }
};

// ===== DELETE PROJECT =====
window.deleteProject = async (id) => {
  if (!confirm('Delete this project?')) return;
  
  try {
    await projectsService.delete(id);
    loadProjects();
    alert('✅ Project deleted');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

// ===== FORM SUBMISSION =====
document.getElementById('projectForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (selectedImages.length === 0) {
    alert('❌ Add at least one image');
    return;
  }

  const projectData = {
    title: document.getElementById('projectTitle').value,
    description: document.getElementById('projectDesc').value,
    link: document.getElementById('projectLink').value,
    technologies: document.getElementById('projectTech').value.split(',').map(t => t.trim()),
    images: selectedImages
  };

  try {
    if (editingProjectId) {
      await projectsService.update(editingProjectId, projectData);
      alert('✅ Project updated');
    } else {
      await projectsService.add(projectData);
      alert('✅ Project added');
    }
    closeModal();
    loadProjects();
    resetForm();
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
});

// ===== IMAGE UPLOAD =====
document.getElementById('imageInput')?.addEventListener('change', async (e) => {
  const files = e.target.files;
  
  for (let file of files) {
    try {
      const url = await storageService.uploadImage(file, 'projects');
      selectedImages.push(url);
      displayImagePreview();
    } catch (error) {
      alert('❌ Upload failed: ' + error.message);
    }
  }
});

// ===== DISPLAY IMAGE PREVIEW =====
function displayImagePreview() {
  const preview = document.getElementById('imagePreview');
  if (!preview) return;

  preview.innerHTML = selectedImages.map((img, idx) => `
    <div class="image-item">
      <img src="${img}" alt="preview" style="width: 100px; height: 100px; object-fit: cover;">
      <button type="button" class="btn-small" onclick="removeImage(${idx})">Remove</button>
    </div>
  `).join('');
}

// ===== REMOVE IMAGE =====
window.removeImage = (idx) => {
  selectedImages.splice(idx, 1);
  displayImagePreview();
};

// ===== MODAL FUNCTIONS =====
document.getElementById('addProjectBtn')?.addEventListener('click', () => {
  editingProjectId = null;
  resetForm();
  document.getElementById('projectModal').classList.add('active');
});

function closeModal() {
  document.getElementById('projectModal').classList.remove('active');
}

window.closeModal = closeModal;

function resetForm() {
  document.getElementById('projectForm').reset();
  selectedImages = [];
  editingProjectId = null;
  if (document.getElementById('imagePreview')) {
    document.getElementById('imagePreview').innerHTML = '';
  }
}

// ===== INITIALIZE =====
console.log('✅ Admin panel loaded');
