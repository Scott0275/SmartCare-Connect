const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');

const PROJECT_ID = 'smartcare-test';
const RULES_FILE = './firestore.rules';

let testEnv;

async function setupTest() {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(RULES_FILE, 'utf8'),
    },
  });
}

function getFirestore(auth) {
  return testEnv.authenticatedContext(auth?.uid, auth).firestore();
}

function getUnauthenticatedFirestore() {
  return testEnv.unauthenticatedContext().firestore();
}

async function testUserAccess() {
  console.log('Testing user access rules...');
  
  const adminDb = getFirestore({ uid: 'admin1', role: 'admin' });
  const userDb = getFirestore({ uid: 'user1', role: 'patient' });
  const unauthDb = getUnauthenticatedFirestore();
  
  // Admin can read any user
  await assertSucceeds(adminDb.collection('users').doc('user1').get());
  
  // User can read own profile
  await assertSucceeds(userDb.collection('users').doc('user1').get());
  
  // User cannot read other user's profile
  await assertFails(userDb.collection('users').doc('user2').get());
  
  // Unauthenticated cannot read users
  await assertFails(unauthDb.collection('users').doc('user1').get());
  
  console.log('✅ User access rules passed');
}

async function testPatientAccess() {
  console.log('Testing patient access rules...');
  
  const doctorDb = getFirestore({ uid: 'doctor1', role: 'doctor' });
  const nurseDb = getFirestore({ uid: 'nurse1', role: 'nurse' });
  const patientDb = getFirestore({ uid: 'patient1', role: 'patient' });
  const otherPatientDb = getFirestore({ uid: 'patient2', role: 'patient' });
  
  // Doctor can read patients
  await assertSucceeds(doctorDb.collection('patients').doc('patient1').get());
  
  // Nurse can create/update patients
  await assertSucceeds(nurseDb.collection('patients').doc('newpatient').set({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  }));
  
  // Patient can read own record
  await assertSucceeds(patientDb.collection('patients').doc('patient1').get());
  
  // Patient cannot read other patient's record
  await assertFails(otherPatientDb.collection('patients').doc('patient1').get());
  
  console.log('✅ Patient access rules passed');
}

async function testBillingAccess() {
  console.log('Testing billing access rules...');
  
  const adminDb = getFirestore({ uid: 'admin1', role: 'admin' });
  const nurseDb = getFirestore({ uid: 'nurse1', role: 'nurse' });
  const patientDb = getFirestore({ uid: 'patient1', role: 'patient' });
  const pharmacyDb = getFirestore({ uid: 'pharmacy1', role: 'pharmacy' });
  
  // Nurse can create bills
  await assertSucceeds(nurseDb.collection('billing').doc('bill1').set({
    patientId: 'patient1',
    totalAmount: 100,
    status: 'pending'
  }));
  
  // Admin can update bills
  await assertSucceeds(adminDb.collection('billing').doc('bill1').update({
    status: 'paid'
  }));
  
  // Patient can read own bills
  await assertSucceeds(patientDb.collection('billing').doc('bill1').get());
  
  // Pharmacy cannot create bills
  await assertFails(pharmacyDb.collection('billing').doc('bill2').set({
    patientId: 'patient1',
    totalAmount: 50
  }));
  
  console.log('✅ Billing access rules passed');
}

async function testUnauthorizedAccess() {
  console.log('Testing unauthorized access prevention...');
  
  const patientDb = getFirestore({ uid: 'patient1', role: 'patient' });
  const unauthDb = getUnauthenticatedFirestore();
  
  // Patient cannot access admin collections
  await assertFails(patientDb.collection('auditLogs').doc('log1').get());
  await assertFails(patientDb.collection('conflicts').doc('conflict1').get());
  await assertFails(patientDb.collection('analyticsSnapshots').doc('snapshot1').get());
  
  // Unauthenticated cannot access anything
  await assertFails(unauthDb.collection('patients').doc('patient1').get());
  await assertFails(unauthDb.collection('prescriptions').doc('rx1').get());
  
  console.log('✅ Unauthorized access prevention passed');
}

async function runTests() {
  try {
    await setupTest();
    
    await testUserAccess();
    await testPatientAccess();
    await testBillingAccess();
    await testUnauthorizedAccess();
    
    console.log('\n🎉 All Firestore rules tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    if (testEnv) {
      await testEnv.cleanup();
    }
  }
}

runTests();