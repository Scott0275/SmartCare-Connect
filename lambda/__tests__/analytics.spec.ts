const { handler } = require('../../lambda/analytics/index.js');
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

describe('Lambda: analytics', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);

  beforeEach(() => {
    ddbMock.reset();
    process.env.PATIENTS_TABLE = 'patients-test';
    process.env.APPOINTMENTS_TABLE = 'appts-test';
  });

  it('returns 401 without Authorization header', async () => {
    const res = await handler({ httpMethod: 'GET', headers: {} });
    expect(res.statusCode).toBe(401);
  });

  it('returns 403 for invalid token', async () => {
    const res = await handler({ httpMethod: 'GET', headers: { Authorization: 'Bearer invalid-token-123' } });
    expect(res.statusCode).toBe(403);
  });

  it('returns metrics when authorized', async () => {
    // Respond to ScanCommand with counts
    ddbMock.on(ScanCommand).resolves({ Count: 2, Items: [{ id: 'a' }, { id: 'b' }] });

    const res = await handler({ httpMethod: 'GET', headers: { Authorization: 'Bearer ok-token-123' }, queryStringParameters: {} });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data).toHaveProperty('totalPatients');
    expect(body.data).toHaveProperty('totalAppointments');
    expect(body.meta).toHaveProperty('generatedAt');
  });
});

export {};
