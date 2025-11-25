exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow GET for health checks (OPTIONS is handled above)
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Skip heavy external checks when explicitly disabled via env
  if (process.env.DISABLE_HEALTH_INTEGRATION_CHECKS) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        timestamp: Date.now(),
        service: process.env.SERVICE_NAME || 'SmartCare Connect API',
        version: process.env.SERVICE_VERSION || '1.0.0',
        checks: { dynamo: { ok: true }, s3: { ok: true }, cognito: { ok: true } }
      })
    };
  }

  // Perform lightweight integration checks when environment variables are present
  const checks = {
    dynamo: { ok: true },
    s3: { ok: true },
    cognito: { ok: true }
  };

  try {
    // Dynamodb check - attempt a lightweight Scan of one item
    if (process.env.DYNAMODB_TABLE || process.env.PATIENTS_TABLE) {
      const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
      const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
      const dClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
      const table = process.env.DYNAMODB_TABLE || process.env.PATIENTS_TABLE;
      await dClient.send(new ScanCommand({ TableName: table, Limit: 1 }));
    }
  } catch (err) {
    console.warn('DynamoDB health check failed:', err?.message || err);
    checks.dynamo.ok = false;
    checks.dynamo.error = err?.message || String(err);
  }

  try {
    // S3 check - try a HeadBucket when bucket is present
    if (process.env.S3_BUCKET || process.env.NEXT_PUBLIC_S3_BUCKET) {
      const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');
      const s3 = new S3Client({});
      const bucket = process.env.S3_BUCKET || process.env.NEXT_PUBLIC_S3_BUCKET;
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    }
  } catch (err) {
    console.warn('S3 health check failed:', err?.message || err);
    checks.s3.ok = false;
    checks.s3.error = err?.message || String(err);
  }

  try {
    // Cognito check - if a user pool id is configured describe it
    if (process.env.COGNITO_USER_POOL_ID) {
      const { CognitoIdentityProviderClient, DescribeUserPoolCommand } = require('@aws-sdk/client-cognito-identity-provider');
      const c = new CognitoIdentityProviderClient({});
      await c.send(new DescribeUserPoolCommand({ UserPoolId: process.env.COGNITO_USER_POOL_ID }));
    }
  } catch (err) {
    console.warn('Cognito health check failed:', err?.message || err);
    checks.cognito.ok = false;
    checks.cognito.error = err?.message || String(err);
  }

  const allOk = checks.dynamo.ok && checks.s3.ok && checks.cognito.ok;

  return {
    statusCode: allOk ? 200 : 500,
    headers,
    body: JSON.stringify({
      status: allOk ? 'ok' : 'degraded',
      timestamp: Date.now(),
      service: process.env.SERVICE_NAME || 'SmartCare Connect API',
      version: process.env.SERVICE_VERSION || '1.0.0',
      checks
    })
  };
};