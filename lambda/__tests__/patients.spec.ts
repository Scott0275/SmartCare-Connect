const { handler } = require('../../lambda/patients/index.js');
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

describe('Lambda: patients', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);

  beforeEach(() => {
    ddbMock.reset();
    process.env.DYNAMODB_TABLE = 'patients-test';
  });

  it('returns 401 when no auth header', async () => {
    const res = await handler({ httpMethod: 'GET', headers: {} });
    expect(res.statusCode).toBe(401);
  });

  it('returns 403 for invalid token', async () => {
    const res = await handler({ httpMethod: 'GET', headers: { Authorization: 'Bearer invalid-token-123' } });
    expect(res.statusCode).toBe(403);
  });

  it('GET returns list when authorized', async () => {
    ddbMock.on(ScanCommand).resolves({ Items: [{ id: 'p1', firstName: 'John', lastName: 'Doe', email: 'john@x.com' }], Count: 1 });

    const res = await handler({ httpMethod: 'GET', headers: { Authorization: 'Bearer ok-token' }, queryStringParameters: {} });
    expect(res.statusCode).toBe(200);
    const items = JSON.parse(res.body);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it('POST returns 400 for missing fields', async () => {
    const res = await handler({ httpMethod: 'POST', headers: { Authorization: 'Bearer ok-token', 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName: 'OnlyFirst' }) });
    expect(res.statusCode).toBe(400);
  });

  it('POST returns 409 for duplicate email', async () => {
    ddbMock.on(ScanCommand).resolves({ Items: [{ email: 'dup@example.com' }], Count: 1 });
    const payload = { firstName: 'Dup', lastName: 'User', email: 'dup@example.com' };

    const res = await handler({ httpMethod: 'POST', headers: { Authorization: 'Bearer ok-token', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    expect(res.statusCode).toBe(409);
  });

  it('POST succeeds for valid payload', async () => {
    ddbMock.on(ScanCommand).resolves({ Items: [], Count: 0 });
    ddbMock.on(PutCommand).resolves({ Attributes: {} });

    const payload = { firstName: 'Anna', lastName: 'Taylor', email: 'anna@example.com' };
    const res = await handler({ httpMethod: 'POST', headers: { Authorization: 'Bearer ok-token', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    expect(res.statusCode).toBe(201);
    const item = JSON.parse(res.body);
    expect(item).toHaveProperty('id');
    expect(item.email).toBe(payload.email);
  });
});

export {};
