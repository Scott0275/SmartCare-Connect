const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

async function testDynamoDB() {
  console.log('🧪 Testing DynamoDB connection...');
  
  try {
    // Test creating a sample patient
    const testPatient = {
      id: 'test-patient-1',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      age: 35,
      doctorId: 'doctor-123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const putCommand = new PutCommand({
      TableName: 'smartcare-connect-dev-patients',
      Item: testPatient
    });

    await docClient.send(putCommand);
    console.log('✅ Successfully created test patient');

    // Test reading all patients
    const scanCommand = new ScanCommand({
      TableName: 'smartcare-connect-dev-patients'
    });

    const result = await docClient.send(scanCommand);
    console.log(`✅ Found ${result.Items?.length || 0} patients in DynamoDB:`);
    
    result.Items?.forEach(patient => {
      console.log(`  - ${patient.name} (${patient.email}) - Role: ${patient.role || 'N/A'}`);
    });

    console.log('\n🎉 DynamoDB connection test successful!');
  } catch (error) {
    console.error('❌ DynamoDB connection test failed:', error);
  }
}

testDynamoDB();