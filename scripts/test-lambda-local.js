// Simple local Lambda function tester without AWS dependencies

async function testHealthFunction() {
  console.log('🧪 Testing Health Lambda Function...\n');
  
  try {
    const { handler } = require('../lambda/health/index.js');
    
    const mockEvent = {
      httpMethod: 'GET',
      headers: {},
      queryStringParameters: null,
      body: null
    };

    const result = await handler(mockEvent);
    
    console.log('✅ Health function test successful');
    console.log('Status Code:', result.statusCode);
    console.log('Response Body:', JSON.parse(result.body));
    
    return result.statusCode === 200;
  } catch (error) {
    console.error('❌ Health function test failed:', error.message);
    return false;
  }
}

async function testCreateUserFunction() {
  console.log('\n🧪 Testing CreateUser Lambda Function...\n');
  
  try {
    // Mock the AWS SDK modules to avoid requiring credentials
    const mockCognito = {
      send: async () => ({ User: { Username: 'test-user-123' } })
    };
    
    const mockDynamo = {
      send: async () => ({})
    };

    // Override require for AWS SDK
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    
    Module.prototype.require = function(id) {
      if (id === '@aws-sdk/client-cognito-identity-provider') {
        return {
          CognitoIdentityProviderClient: function() { return mockCognito; },
          AdminCreateUserCommand: function() {},
          AdminSetUserPasswordCommand: function() {}
        };
      }
      if (id === '@aws-sdk/client-dynamodb') {
        return { DynamoDBClient: function() {} };
      }
      if (id === '@aws-sdk/lib-dynamodb') {
        return {
          DynamoDBDocumentClient: { from: () => mockDynamo },
          PutCommand: function() {}
        };
      }
      return originalRequire.apply(this, arguments);
    };

    const { handler } = require('../lambda/createUser/index.js');
    
    const mockEvent = {
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer test-token' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpass123',
        role: 'nurse'
      })
    };

    // Set required environment variables
    process.env.COGNITO_USER_POOL_ID = 'test-pool';
    process.env.USERS_TABLE = 'test-users-table';

    const result = await handler(mockEvent);
    
    // Restore original require
    Module.prototype.require = originalRequire;
    
    console.log('✅ CreateUser function test successful');
    console.log('Status Code:', result.statusCode);
    console.log('Response Body:', JSON.parse(result.body));
    
    return result.statusCode === 200;
  } catch (error) {
    console.error('❌ CreateUser function test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Running Local Lambda Function Tests\n');
  
  const results = [];
  
  results.push(await testHealthFunction());
  results.push(await testCreateUserFunction());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🎉 All Lambda functions are working correctly!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed.');
    process.exit(1);
  }
}

runAllTests();