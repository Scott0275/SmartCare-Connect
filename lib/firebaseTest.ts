import { db, auth } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export async function testFirebaseConnection() {
  const results = {
    dbAvailable: !!db,
    authAvailable: !!auth,
    userAuthenticated: !!auth?.currentUser,
    canRead: false,
    canWrite: false,
    error: null as string | null
  };

  if (!db) {
    results.error = 'Firestore database not initialized';
    return results;
  }

  if (!auth?.currentUser) {
    results.error = 'User not authenticated';
    return results;
  }

  try {
    // Test read access
    const testCollection = collection(db, 'users');
    await getDocs(testCollection);
    results.canRead = true;
  } catch (error: any) {
    results.error = `Read test failed: ${error.message}`;
    return results;
  }

  try {
    // Test write access with a simple document
    const testData = {
      test: true,
      timestamp: new Date(),
      userId: auth.currentUser.uid
    };
    
    await addDoc(collection(db, 'testCollection'), testData);
    results.canWrite = true;
  } catch (error: any) {
    results.error = `Write test failed: ${error.message}`;
  }

  return results;
}