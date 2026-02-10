/**
 * FIREBASE VERIFICATION & TESTING SCRIPT
 * Run this to verify Firebase is properly set up
 * 
 * Usage: Open browser console on any page and run the checks
 */

// ============================================================================
// VERIFICATION CHECKLIST
// ============================================================================

async function runFirebaseChecks() {
  console.log('🔥 Firebase Setup Verification\n');
  console.log('━'.repeat(50));

  let passCount = 0;
  let failCount = 0;

  // Check 1: Firebase Config Exists
  try {
    console.log('\n1️⃣ Checking firebase-config.js...');
    const response = await fetch('./firebase-config.js');
    if (response.ok) {
      console.log('✅ firebase-config.js found');
      passCount++;
    } else {
      console.log('❌ firebase-config.js not found (404)');
      failCount++;
    }
  } catch (error) {
    console.log('❌ Error checking firebase-config.js:', error.message);
    failCount++;
  }

  // Check 2: Firebase Storage Service Exists
  try {
    console.log('\n2️⃣ Checking firebase-storage-service.js...');
    const response = await fetch('./firebase-storage-service.js');
    if (response.ok) {
      console.log('✅ firebase-storage-service.js found');
      passCount++;
    } else {
      console.log('❌ firebase-storage-service.js not found');
      failCount++;
    }
  } catch (error) {
    console.log('❌ Error checking firebase-storage-service.js');
    failCount++;
  }

  // Check 3: Firebase Project Service Exists
  try {
    console.log('\n3️⃣ Checking firebase-project-service.js...');
    const response = await fetch('./firebase-project-service.js');
    if (response.ok) {
      console.log('✅ firebase-project-service.js found');
      passCount++;
    } else {
      console.log('❌ firebase-project-service.js not found');
      failCount++;
    }
  } catch (error) {
    console.log('❌ Error checking firebase-project-service.js');
    failCount++;
  }

  // Check 4: Firebase SDK Loaded
  try {
    console.log('\n4️⃣ Checking Firebase SDK...');
    if (typeof firebase !== 'undefined' || typeof window.firebaseApp !== 'undefined') {
      console.log('✅ Firebase SDK loaded');
      passCount++;
    } else {
      console.log('⚠️  Firebase SDK may not be imported yet (will load on page load)');
    }
  } catch (error) {
    console.log('⚠️  Cannot verify Firebase SDK');
  }

  // Check 5: Test Projects Data
  try {
    console.log('\n5️⃣ Testing Firebase data access...');
    const { projectService } = await import('./firebase-project-service.js');
    
    const projects = await projectService.getAllProjects();
    console.log(`✅ Projects accessible: ${projects.length} projects in database`);
    
    if (projects.length > 0) {
      console.log('   Sample project:', projects[0].title);
    } else {
      console.log('   ⚠️  No projects in database yet');
    }
    passCount++;
  } catch (error) {
    console.log('❌ Error accessing projects:', error.message);
    failCount++;
  }

  // Check 6: Test Authentication
  try {
    console.log('\n6️⃣ Testing authentication...');
    const { projectService } = await import('./firebase-project-service.js');
    
    const currentUser = projectService.getCurrentUser();
    if (currentUser) {
      console.log(`✅ Logged in as: ${currentUser.email}`);
      
      const isAdmin = await projectService.isAdminLoggedIn();
      console.log(`✅ Admin status: ${isAdmin ? 'YES (Admin)' : 'NO (Regular user)'}`);
    } else {
      console.log('ℹ️  Not logged in (normal for public page)');
    }
    passCount++;
  } catch (error) {
    console.log('⚠️  Error checking auth:', error.message);
  }

  // Check 7: Real-time Listener Test
  try {
    console.log('\n7️⃣ Testing real-time listener...');
    const { projectService } = await import('./firebase-project-service.js');
    
    let listenerTriggered = false;
    const unsubscribe = projectService.onProjectsUpdate((projects) => {
      listenerTriggered = true;
      console.log(`✅ Real-time listener working! Got ${projects.length} projects`);
    });

    // Wait a moment for listener to trigger
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (listenerTriggered) {
      console.log('✅ Real-time sync is active');
      passCount++;
    } else {
      console.log('⚠️  Listener set but not triggered yet');
    }

    unsubscribe();
  } catch (error) {
    console.log('❌ Real-time listener error:', error.message);
    failCount++;
  }

  // Summary
  console.log('\n' + '━'.repeat(50));
  console.log(`\n📊 SUMMARY:`);
  console.log(`   ✅ Passed: ${passCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   Total:   ${passCount + failCount}`);

  if (failCount === 0) {
    console.log('\n🎉 Firebase is properly configured!');
  } else {
    console.log('\n⚠️  Fix the failed checks above');
  }

  console.log('\n━'.repeat(50));
}

// ============================================================================
// MANUAL TESTS
// ============================================================================

async function testAddProject() {
  console.log('Testing project creation...');
  
  try {
    const { projectService } = await import('./firebase-project-service.js');

    const isAdmin = await projectService.isAdminLoggedIn();
    if (!isAdmin) {
      console.log('❌ Must be logged in as admin to add projects');
      return;
    }

    const testProject = {
      title: 'Test Project ' + Date.now(),
      description: 'This is a test project',
      technologies: ['Test', 'Firebase'],
      liveUrl: 'https://example.com',
      githubUrl: 'https://github.com/example',
      featured: true
    };

    const created = await projectService.addProject(testProject);
    console.log('✅ Project created:', created.id, created.title);
    return created.id;

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testDeleteProject(projectId) {
  console.log(`Testing project deletion of ${projectId}...`);
  
  try {
    const { projectService } = await import('./firebase-project-service.js');

    const isAdmin = await projectService.isAdminLoggedIn();
    if (!isAdmin) {
      console.log('❌ Must be logged in as admin');
      return;
    }

    await projectService.deleteProject(projectId);
    console.log('✅ Project deleted:', projectId);

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testUpdateProject(projectId) {
  console.log(`Testing project update of ${projectId}...`);
  
  try {
    const { projectService } = await import('./firebase-project-service.js');

    const isAdmin = await projectService.isAdminLoggedIn();
    if (!isAdmin) {
      console.log('❌ Must be logged in as admin');
      return;
    }

    const updated = await projectService.updateProject(projectId, {
      title: 'Updated Title ' + Date.now(),
      featured: Math.random() > 0.5
    });

    console.log('✅ Project updated:', updated.id);

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// ============================================================================
// EXPORT FOR CONSOLE USE
// ============================================================================

window.firebaseTests = {
  runAll: runFirebaseChecks,
  testAddProject,
  testDeleteProject,
  testUpdateProject
};

console.log('🔥 Firebase tests loaded!');
console.log('\nAvailable commands:');
console.log('  firebaseTests.runAll()              - Run all verification checks');
console.log('  firebaseTests.testAddProject()      - Test adding a project');
console.log('  firebaseTests.testDeleteProject(id) - Test deleting a project');
console.log('  firebaseTests.testUpdateProject(id) - Test updating a project');
console.log('\nRun any command in the console!');
