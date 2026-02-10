<!-- FIREBASE QUICK REFERENCE -->

# 🔥 Firebase - Quick Reference Card

## 📍 Key Websites

| Task | URL |
|------|-----|
| Create Project | https://firebase.google.com/console |
| Project Settings | Firebase Console → ⚙️ Settings |
| Firestore Data | Firebase Console → Build → Firestore Database |
| Authentication | Firebase Console → Build → Authentication |
| Storage | Firebase Console → Build → Storage |

---

## 🗂️ Project Folder Structure

```
my-portfolio/
├── firebase-config.js
├── firebase-storage-service.js
├── firebase-project-service.js
├── FIREBASE_SETUP_STEPS.md
├── FIREBASE_HTML_EXAMPLES.html
├── firebase-test-script.js
├── FIREBASE_CHECKLIST.md
│
├── projects.html (UPDATE)
├── admin-add-project.html (UPDATE)
└── admin-project-manager.html (UPDATE)
```

---

## 🔐 Firestore Collections Schema

```javascript
// Collections to create:

projects/
  ├── project_001/
  │   ├── title (string)
  │   ├── description (string)
  │   ├── images (array of URLs)
  │   ├── technologies (array)
  │   ├── liveUrl (string)
  │   ├── githubUrl (string)
  │   ├── featured (boolean)
  │   ├── createdAt (timestamp)
  │   └── updatedAt (timestamp)

admin_users/
  ├── uid_xxxxx/  // Firebase user UID
  │   ├── email (string)
  │   ├── name (string)
  │   ├── role (string) = "admin"
  │   └── createdAt (timestamp)
```

---

## 🔑 Security Rules (Copy-Paste)

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{document=**} {
      allow read: if true;
      allow create, update, delete: if isAdmin(request.auth.uid);
    }
    match /admin_users/{uid} {
      allow read: if isSignedIn() && isAdmin(request.auth.uid);
      allow write: if false;
    }
  }
  function isSignedIn() { return request.auth != null; }
  function isAdmin(uid) {
    return exists(/databases/$(database)/documents/admin_users/$(uid)) &&
           get(/databases/$(database)/documents/admin_users/$(uid)).data.role == "admin";
  }
}
```

### Storage Rules
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

---

## 💻 Common Code Snippets

### Import Services
```javascript
import { projectService } from './firebase-project-service.js';
```

### Get All Projects
```javascript
const projects = await projectService.getAllProjects();
console.log(projects); // Array of project objects
```

### Real-time Listener (Auto-updates)
```javascript
const unsubscribe = projectService.onProjectsUpdate((projects) => {
  console.log('Projects updated:', projects);
  renderProjects(projects); // Your render function
});

// Stop listening when done
window.addEventListener('beforeunload', () => unsubscribe?.());
```

### Add Project (Admin Only)
```javascript
const newProject = await projectService.addProject({
  title: "My App",
  description: "Amazing project",
  technologies: ["React", "Firebase"],
  liveUrl: "https://...",
  githubUrl: "https://...",
  featured: true
});
```

### Update Project
```javascript
const updated = await projectService.updateProject(projectId, {
  title: "Updated Title",
  featured: false
});
```

### Delete Project
```javascript
await projectService.deleteProject(projectId);
```

### Check Admin Status
```javascript
const isAdmin = await projectService.isAdminLoggedIn();
if (isAdmin) {
  console.log('User is admin');
}
```

### Get Current User
```javascript
const user = projectService.getCurrentUser();
if (user) {
  console.log('Logged in as:', user.email);
}
```

---

## 🧪 Testing Commands

Open console (F12) and run:

```javascript
// Verify all Firebase setup
firebaseTests.runAll()

// Test adding project
firebaseTests.testAddProject()

// Test deleting project (replace ID)
firebaseTests.testDeleteProject('project_id')

// Test updating project
firebaseTests.testUpdateProject('project_id')
```

---

## 🚨 Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "Cannot find module" | Check file is in project root |
| "Permission denied" | User must be in admin_users collection with role="admin" |
| "Projects not syncing" | Use onProjectsUpdate() not getAllProjects() |
| "Images not loading" | Use full URLs, not local C:\... paths |
| "Firebase is undefined" | Add `type="module"` to script tag |
| "Auth not working" | Check Email/Password is enabled in Firebase |

---

## ✅ Quick Setup Checklist

```
Firebase Console Setup (10 min):
□ Create project at firebase.google.com
□ Get credentials → paste in firebase-config.js
□ Enable Firestore Database
□ Enable Authentication (Email/Password)
□ Enable Storage
□ Deploy Firestore rules
□ Deploy Storage rules
□ Create admin user & profile

Project Setup (5 min):
□ Copy 3 firebase-*.js files
□ Copy FIREBASE_HTML_EXAMPLES.html code into your HTML files
□ Verify products.html has id="projects-container"
□ Verify admin forms have correct IDs

Testing (5 min):
□ Open projects.html → should display
□ Open console → run firebaseTests.runAll()
□ Add project from admin → should appear instantly
□ Test on another device/browser
□ ✅ Done!
```

---

## 📞 Deployment Checklist

Before going live:

- [ ] Firebase security rules are published ✓
- [ ] Admin user created with correct UID
- [ ] All image URLs are valid (not local paths)
- [ ] Tested on multiple devices
- [ ] Tested on different browsers
- [ ] Firebase credentials are ONLY in firebase-config.js
- [ ] Credentials never committed to git
- [ ] Deployed to Netlify
- [ ] Live site tested and working

---

## 🎯 Data Flow Diagram

```
Admin Device                  Firebase Cloud           Public Device
     ↓                             ↓                          ↓
  [Add Project] ────────→ [Firestore Database] ←───────── [View Projects]
                              ↑       ↓
                     Real-time Sync Updates
                       (Instant, All Devices)
```

---

## 💰 Firebase Free Tier

✅ **Always Free:**
- 1 GB storage
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day
- Unlimited users

Most portfolios never exceed this!

---

## 📚 Learn More

- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Real-time Listeners](https://firebase.google.com/docs/firestore/query-data/listen)

---

## 🎓 Project Architecture

```
┌─────────────────────────────────────────┐
│  Modern Portfolio with Cloud Sync       │
├─────────────────────────────────────────┤
│                                         │
│  Layer 1: Database (Firebase Firestore) │
│  • Cloud, Real-time, Secure             │
│                                         │
│  Layer 2: Storage (Firebase Storage)    │
│  • Host images, Works on live site      │
│                                         │
│  Layer 3: Auth (Firebase Auth)          │
│  • Secure admin login                   │
│                                         │
│  Layer 4: Frontend (HTML/JS)            │
│  • Real-time updates                    │
│  • Multi-device sync                    │
│                                         │
└─────────────────────────────────────────┘
```

---

**Last Updated:** Feb 2026 | **Firebase v10.7+** | **Modern Web Stack**
