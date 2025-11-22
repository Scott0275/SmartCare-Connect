const admin = require('firebase-admin');
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");

// Initialize Firebase Admin
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString());
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Initialize DynamoDB
const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const COLLECTIONS_TO_MIGRATE = [
  'patients',
  'prescriptions', 
  'appointments',
  'vitals',
  'billing',
  'users'
];

async function migrateCollection(collectionName) {
  console.log(`Starting migration for ${collectionName}...`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    const documents = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });

    console.log(`Found ${documents.length} documents in ${collectionName}`);

    // Batch write to DynamoDB (max 25 items per batch)
    const tableName = `smartcare-connect-dev-${collectionName}`;
    const batches = [];
    
    for (let i = 0; i < documents.length; i += 25) {
      const batch = documents.slice(i, i + 25);
      batches.push(batch);
    }

    for (const batch of batches) {
      const putRequests = batch.map(item => ({
        PutRequest: { Item: item }
      }));

      const command = new BatchWriteCommand({
        RequestItems: {
          [tableName]: putRequests
        }
      });

      await docClient.send(command);
      console.log(`Migrated batch of ${batch.length} items to ${tableName}`);
    }

    console.log(`✅ Successfully migrated ${documents.length} documents from ${collectionName}`);
    return documents.length;
  } catch (error) {
    console.error(`❌ Error migrating ${collectionName}:`, error);
    return 0;
  }
}

async function migrateAllCollections() {
  console.log('🚀 Starting Firestore to DynamoDB migration...\n');
  
  let totalMigrated = 0;
  
  for (const collection of COLLECTIONS_TO_MIGRATE) {
    const count = await migrateCollection(collection);
    totalMigrated += count;
    console.log(''); // Empty line for readability
  }
  
  console.log(`🎉 Migration complete! Total documents migrated: ${totalMigrated}`);
}

// Run migration
migrateAllCollections().catch(console.error);