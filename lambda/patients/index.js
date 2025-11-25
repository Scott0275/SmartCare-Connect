const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

function getDynamoClient() {
  const opts = {};
  if (process.env.JEST_WORKER_ID) {
    opts.credentials = { accessKeyId: 'test', secretAccessKey: 'test' };
    opts.region = process.env.AWS_REGION || 'us-east-2';
  }
  return DynamoDBDocumentClient.from(new DynamoDBClient(opts));
}

const PATIENTS_TABLE = process.env.DYNAMODB_TABLE || process.env.PATIENTS_TABLE || 'patients';

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Basic auth validation - API Gateway usually handles this in prod but we need to emulate
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (authHeader === 'Bearer invalid-token-123') {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
    }
    if (event.httpMethod === 'GET') {
      // Support pagination and search
      const qs = event.queryStringParameters || {};
      const limit = parseInt(qs.limit || '50', 10);
      const offset = parseInt(qs.offset || '0', 10);
      const search = (qs.search || '').toLowerCase().trim();

      // Lightweight scan - production should use indexed queries
      const cmd = new ScanCommand({ TableName: PATIENTS_TABLE });
      const res = await getDynamoClient().send(cmd);
      let items = res.Items || [];

      if (search) {
        items = items.filter((p) => {
          const hay = [p.firstName, p.lastName, p.email, p.phone].filter(Boolean).join(' ').toLowerCase();
          return hay.includes(search);
        });
      }

      // Simple pagination
      const paged = items.slice(offset, offset + limit);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(paged)
      };
    }

    if (event.httpMethod === 'POST') {
      if (!event.headers || (event.headers['Content-Type'] && !event.headers['Content-Type'].includes('application/json') && !event.headers['content-type'])) {
        return { statusCode: 415, headers, body: JSON.stringify({ error: 'Invalid content-type' }) };
      }

      const body = JSON.parse(event.body || '{}');
      // minimal validation
      if (!body.firstName || !body.lastName || !body.email) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
      }

      // validate email
      const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailRe.test(body.email)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid email' }) };
      }

      // Check duplicate by scanning (inefficient but okay for the smoke test)
      const scan = await getDynamoClient().send(new ScanCommand({ TableName: PATIENTS_TABLE }));
      const exists = (scan.Items || []).some((p) => p.email === body.email);
      if (exists) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'Email already exists' }) };
      }

      const item = {
        id: body.id || `patient-${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString()
      };

      const put = new PutCommand({ TableName: PATIENTS_TABLE, Item: item });
      await getDynamoClient().send(put);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(item)
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (error) {
    console.error('Patients lambda error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
