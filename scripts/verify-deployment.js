const https = require('https');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function verifyDeployment() {
  console.log('🔍 Verifying AWS Lambda Deployment...\n');
  
  const apiUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL;
  
  if (!apiUrl) {
    console.log('⚠️  API Gateway URL not configured');
    console.log('   Set NEXT_PUBLIC_API_GATEWAY_URL in .env.local');
    console.log('   Example: https://abc123.execute-api.us-east-1.amazonaws.com/dev');
    return false;
  }
  
  console.log(`🌐 Testing API Gateway: ${apiUrl}`);
  
  const tests = [
    { name: 'Health Check', path: '/health', method: 'GET' },
    { name: 'Analytics Summary', path: '/analytics/summary', method: 'GET' }
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 Testing: ${test.name}`);
      console.log(`   URL: ${apiUrl}${test.path}`);
      
      const response = await makeRequest(`${apiUrl}${test.path}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.statusCode === 200) {
        console.log(`✅ ${test.name} - Status: ${response.statusCode}`);
        try {
          const data = JSON.parse(response.body);
          console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
        } catch {
          console.log(`   Response: ${response.body.substring(0, 100)}...`);
        }
      } else {
        console.log(`❌ ${test.name} - Status: ${response.statusCode}`);
        console.log(`   Error: ${response.body}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.message}`);
      allPassed = false;
    }
  }
  
  console.log('\n📊 Deployment Verification Results:');
  if (allPassed) {
    console.log('✅ All endpoints are working correctly!');
    console.log('🚀 Lambda functions are successfully deployed and accessible via API Gateway');
  } else {
    console.log('❌ Some endpoints failed verification');
    console.log('💡 Check AWS Console for Lambda and API Gateway configuration');
  }
  
  return allPassed;
}

// Check if we should test local or deployed
if (process.env.NEXT_PUBLIC_USE_AWS === 'true') {
  verifyDeployment()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
} else {
  console.log('🏠 AWS not enabled - running local Lambda tests instead\n');
  require('./test-lambda-local.js');
}