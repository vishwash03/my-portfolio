<!-- FIREBASE SETUP QUICK REFERENCE -->

# Firebase Firestore Setup - Step by Step

## Step 1️⃣: Create Firebase Project
**Location:** https://firebase.google.com/console

1. Click "Go to console"
2. Click "Create a project"
3. Name: `portfolio-projects`
4. Skip "Enable Google Analytics"
5. Click "Create project"
6. **Wait** ⏳ for project to initialize

---

## Step 2️⃣: Get Firebase Credentials

1. Click ⚙️ **Settings** (gear icon, top-left)
2. Click "Project settings"
3. Scroll to **"Your apps"** section
4. Click **Web icon** (</>) to add web app
5. App name: `portfolio-web`
6. **Copy this config block:**

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

7. **Paste into** `firebase-config.js` in your project

---

## Step 3️⃣: Copy 3 Core Files

Copy these **3 files** to your project folder:

✅ `firebase-config.js` - Your credentials (from step 2)
✅ `firebase-storage-service.js` - Database layer
✅ `firebase-project-service.js` - Business logic

**File locations in project:**
```
my-portfolio/
├── firebase-config.js              ← UPDATE with YOUR credentials
├── firebase-storage-service.js     ← Copy as-is
└── firebase-project-service.js     ← Copy as-is
```

---

## Step 4️⃣: Enable Firestore Database

1. In Firebase console, click **"Build"** (left sidebar)
2. Click **"Firestore Database"**
3. Click **"Create database"**
4. Mode: **"Production"** (or Test for development)
5. Region: **`us-east1`**
6. Click **"Create"**
7. **Wait** ⏳ for database to initialize

---

## Step 5️⃣: Enable Authentication

1. Click **"Authentication"**
2. Click **"Get started"**
3. Click **"Email/Password"** provider
4. **Enable it** (toggle on)
5. Click **"Save"**

---

## Step 6️⃣: Enable Storage (for Images)

1. Click **"Storage"**
2. Click **"Get started"**
3. Mode: **"Production"** (or Test)
4. Region: **`us-east1`**
5. Click **"Done"**

---

## Step 7️⃣: Update HTML Files

### For `projects.html` (Display Projects)

Add at the top in `<head>`:

```html
<script type="module">
  import { projectService } from './firebase-project-service.js';
  
  let projects = [];
  let unsubscribe = null;

  async function loadProjects() {
    try {
      // Real-time listener - gets updates instantly
      unsubscribe = projectService.onProjectsUpdate((updated) => {
        projects = updated;
        renderProjects();
      });
      
      // Initial load
      projects = await projectService.getAllProjects();
      renderProjects();
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }

  function renderProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;
    
    container.innerHTML = projects.map(p => `
      <div class="project-card">
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <div class="tech-stack">
          ${p.technologies?.map(t => `<span>${t}</span>`).join('')}
        </div>
        ${p.liveUrl ? `<a href="${p.liveUrl}" target="_blank">Live</a>` : ''}
        ${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank">GitHub</a>` : ''}
      </div>
    `).join('');
  }

  document.addEventListener('DOMContentLoaded', loadProjects);
  window.addEventListener('beforeunload', () => unsubscribe?.());
</script>
```

### For Admin Panel (`admin-add-project.html`)

Add form submission handler:

```html
<script type="module">
  import { projectService } from './firebase-project-service.js';

  async function handleAddProject(event) {
    event.preventDefault();
    
    try {
      const formData = new FormData(event.target);
      
      const project = await projectService.addProject({
        title: formData.get('title'),
        description: formData.get('description'),
        technologies: formData.get('technologies').split(',').map(t => t.trim()),
        liveUrl: formData.get('liveUrl'),
        githubUrl: formData.get('githubUrl'),
        featured: formData.get('featured') === 'on'
      });
      
      alert(`✅ Project "${project.title}" added!`);
      event.target.reset();
      location.reload();
      
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  }

  const form = document.getElementById('add-project-form');
  if (form) form.addEventListener('submit', handleAddProject);
</script>
```

---

## Step 8️⃣: Deploy Security Rules

### Firestore Rules

1. Go to **Firestore > Rules**
2. Replace everything with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // READ: Public (anyone can see projects)
    match /projects/{document=**} {
      allow read: if true;
      allow create, update, delete: if isAdmin(request.auth.uid);
    }

    // Admin users (protected)
    match /admin_users/{uid} {
      allow read: if isSignedIn() && isAdmin(request.auth.uid);
      allow write: if false;
    }
  }

  function isSignedIn() {
    return request.auth != null;
  }

  function isAdmin(uid) {
    return exists(/databases/$(database)/documents/admin_users/$(uid)) &&
           get(/databases/$(database)/documents/admin_users/$(uid)).data.role == "admin";
  }
}
```

3. Click **"Publish"**

### Storage Rules

1. Go to **Storage > Rules**
2. Replace everything with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /project-images/{allPaths=**} {
      allow read: if true;
      allow write, delete: if isAdmin(request.auth.uid);
    }
  }

  function isAdmin(uid) {
    return exists(/databases/(default)/documents/admin_users/$(uid)) &&
           get(/databases/(default)/documents/admin_users/$(uid)).data.role == "admin";
  }
}
```

3. Click **"Publish"**

---

## Step 9️⃣: Create Admin User

### Get UID:

1. **Authentication** > **Users**
2. Click **"Create user"**
3. Email: `your-email@gmail.com`
4. Password: `your-password` (save it!)
5. Click **"Create user"**
6. **Copy the UID** (long string)

### Create Admin Profile:

1. Go to **Firestore > Data**
2. Click **"Create collection"**
3. Name: `admin_users`
4. Document ID: **Paste the UID from above**
5. Add fields:
   - `role` (string): `admin`
   - `email` (string): `your-email@gmail.com`
   - `name` (string): `Your Name`
   - `createdAt` (timestamp): current time

6. Click **"Save"**

---

## Step 🔟: Test on Multiple Devices

### Test 1: Real-time Sync

1. **Device A:** Open `projects.html`
2. **Device B:** Open same URL (different browser/device)
3. **Admin:** Add a new project
4. ✅ **Should appear instantly** on both devices!

### Test 2: Images

1. Add project with image
2. Image should display
3. Try on different device - should work

### Test 3: Admin Access

1. Sign in as admin
2. Should see add/edit/delete options
3. Non-logged-in users - should see projects only

---

## 🔍 Verify It's Working

**In Browser Console, check:**

```javascript
// Open projects.html and check console
console.log('Projects loaded:', projects.length);
```

**Common outputs:**
- ✅ `Projects loaded: 5` → Working!
- ❌ `Projects loaded: 0` → Check Firestore has data
- ❌ `Firebase is not defined` → Check firebase-config.js imported

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| "Permission denied" | Check Admin user exists in Firestore |
| Projects not syncing | Check internet connection, refresh page |
| Images not loading | Use Firebase Storage or relative paths |
| Auth not working | Check Email/Password enabled in Firebase |
| Security rules error | Check rules syntax in Firestore |

---

## 💰 Firebase Free Tier Limits

✅ **Free Forever:**
- 1 GB storage
- 50,000 reads/day
- 20,000 writes/day
- Unlimited users

Perfect for portfolio projects! 

---

## 📱 Cross-Device Testing

To test on multiple devices:

1. Deploy to Netlify
2. Share Netlify URL with yourself
3. Open on phone, tablet, another computer
4. Add project from admin
5. Should see instantly on all devices ✅
