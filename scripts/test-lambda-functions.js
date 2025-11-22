const fetch = require('node-fetch');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

async function testLambdaFunctions() {
  console.log('🧪 Testing Lambda Functions via API Gateway...\n');

  if (!API_BASE_URL) {
    console.error('❌ NEXT_PUBLIC_API_GATEWAY_URL not configured');
    process.exit(1);
  }

  const tests = [
    {
      name: 'Health Check',
      method: 'GET',
      endpoint: '/health',
      expectedStatus: 200
    },
    {
      name: 'Analytics Summary',
      method: 'GET',
      endpoint: '/analytics/summary?dateRange=30d',
      expectedStatus: 200
    },
    {
      name: 'Get Patients',
      method: 'GET',
      endpoint: '/patients',
      expectedStatus: 200
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      
      const response = await fetch(`${API_BASE_URL}${test.endpoint}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === test.expectedStatus) {
        const data = await response.json();
        console.log(`✅ ${test.name} - Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - Expected: ${test.expectedStatus}, Got: ${response.status}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All Lambda functions are working correctly!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the API Gateway and Lambda configuration.');
  }
}

// Test individual Lambda function locally
async function testLocalLambda(functionName) {
  console.log(`🧪 Testing ${functionName} Lambda function locally...\n`);
  
  try {
    const lambdaPath = `../lambda/${functionName}/index.js`;
    const { handler } = require(lambdaPath);
    
    const mockEvent = {
      httpMethod: 'GET',
      headers: {},
      queryStringParameters: {},
      body: null
    };

    const result = await handler(mockEvent);
    
    console.log('✅ Local test successful');
    console.log('Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Local test failed:', error.message);
  }
}

// Run tests based on command line arguments
const args = process.argv.slice(2);
if (args.includes('--local')) {
  const functionName = args[args.indexOf('--local') + 1] || 'health';
  testLocalLambda(functionName);
} else {
  testLambdaFunctions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}