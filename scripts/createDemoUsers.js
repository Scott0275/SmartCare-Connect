// Demo user creation script
// Run this once to create demo accounts for testing

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up service account)
const serviceAccount = require('../path/to/serviceAccountKey.json'); // You need to add this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const demoUsers = [
  { email: 'admin@smartcare.demo', password: 'demo123', role: 'admin' },
  { email: 'doctor@smartcare.demo', password: 'demo123', role: 'doctor' },
  { email: 'nurse@smartcare.demo', password: 'demo123', role: 'nurse' },
  { email: 'patient@smartcare.demo', password: 'demo123', role: 'patient' },
  { email: 'labtech@smartcare.demo', password: 'demo123', role: 'labtech' },
  { email: 'pharmacy@smartcare.demo', password: 'demo123', role: 'pharmacy' }
];

async function createDemoUsers() {
  for (const user of demoUsers) {
    try {
      // Create user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email: user.email,
        password: user.password,
      });

      // Save role in Firestore
      await admin.firestore().collection('users').doc(userRecord.uid).set({
        role: user.role,
        uid: userRecord.uid,
        email: user.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Created ${user.role}: ${user.email}`);
    } catch (error) {
      console.error(`❌ Error creating ${user.email}:`, error.message);
    }
  }
}

createDemoUsers().then(() => {
  console.log('Demo users creation completed');
  process.exit(0);
});