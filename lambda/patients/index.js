const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

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
    if (event.httpMethod === 'GET') {
      // Lightweight scan for demo / smoke test - not recommended for production large tables
      const cmd = new ScanCommand({ TableName: PATIENTS_TABLE, Limit: 50 });
      const res = await dynamoClient.send(cmd);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, count: res.Count || 0, items: res.Items || [] })
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const item = {
        id: body.id || `patient-${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString()
      };

      const put = new PutCommand({ TableName: PATIENTS_TABLE, Item: item });
      await dynamoClient.send(put);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, item })
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (error) {
    console.error('Patients lambda error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
