const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const sampleData = {
  patients: [
    {
      id: 'patient-001',
      name: 'Alice Johnson',
      email: 'alice.johnson@example.com',
      age: 45,
      gender: 'Female',
      doctorId: 'doctor-001',
      phone: '+1-555-0101',
      allergies: ['Penicillin', 'Shellfish'],
      chronicConditions: ['Diabetes Type 2', 'Hypertension']
    },
    {
      id: 'patient-002', 
      name: 'Bob Wilson',
      email: 'bob.wilson@example.com',
      age: 32,
      gender: 'Male',
      doctorId: 'doctor-001',
      phone: '+1-555-0102',
      allergies: ['Latex'],
      chronicConditions: []
    }
  ],
  prescriptions: [
    {
      id: 'rx-001',
      patientId: 'patient-001',
      doctorId: 'doctor-001',
      medication: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      duration: '30 days',
      status: 'active'
    },
    {
      id: 'rx-002',
      patientId: 'patient-002',
      doctorId: 'doctor-001', 
      medication: 'Ibuprofen',
      dosage: '200mg',
      frequency: 'As needed',
      duration: '7 days',
      status: 'active'
    }
  ],
  appointments: [
    {
      id: 'apt-001',
      patientId: 'patient-001',
      doctorId: 'doctor-001',
      date: '2025-11-25',
      time: '10:00',
      type: 'Follow-up',
      status: 'scheduled'
    }
  ],
  vitals: [
    {
      id: 'vital-001',
      patientId: 'patient-001',
      bloodPressure: '140/90',
      heartRate: 78,
      temperature: 98.6,
      weight: 165,
      height: 65,
      recordedBy: 'nurse-001'
    }
  ]
};

async function createSampleData() {
  console.log('🚀 Creating sample medical data in DynamoDB...\n');
  
  for (const [collection, items] of Object.entries(sampleData)) {
    console.log(`Creating ${items.length} ${collection}...`);
    
    for (const item of items) {
      try {
        const command = new PutCommand({
          TableName: `smartcare-connect-dev-${collection}`,
          Item: {
            ...item,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        });
        
        await docClient.send(command);
        console.log(`  ✅ Created ${item.name || item.medication || item.id}`);
      } catch (error) {
        console.error(`  ❌ Failed to create ${item.id}:`, error.message);
      }
    }
    console.log('');
  }
  
  console.log('🎉 Sample data creation complete!');
}

createSampleData();