const { initOfflineDB, addQueuedAction, getQueuedActions } = require('../lib/offlineDb');

async function testOfflineSync() {
  console.log('🧪 Testing offline sync functionality...\n');
  
  try {
    // Initialize offline database
    await initOfflineDB();
    console.log('✅ Offline database initialized');

    // Add a queued action (simulating offline operation)
    const actionId = await addQueuedAction({
      type: 'create',
      collection: 'patients',
      docId: 'offline-patient-001',
      payload: {
        name: 'Offline Patient',
        email: 'offline@example.com',
        age: 28,
        doctorId: 'doctor-001'
      }
    });
    
    console.log(`✅ Queued offline action: ${actionId}`);

    // Get all queued actions
    const queuedActions = await getQueuedActions();
    console.log(`✅ Found ${queuedActions.length} queued actions`);
    
    queuedActions.forEach(action => {
      console.log(`  - ${action.type} ${action.collection}/${action.docId}`);
    });

    console.log('\n🎉 Offline sync test successful!');
    console.log('💡 When online, run syncPendingActions() to sync to DynamoDB');
    
  } catch (error) {
    console.error('❌ Offline sync test failed:', error);
  }
}

testOfflineSync();