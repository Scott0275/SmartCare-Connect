const { handler } = require('../../lambda/createUser/index.js');
import { mockClient } from 'aws-sdk-client-mock';
import { CognitoIdentityProviderClient, AdminCreateUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

describe('Lambda: createUser', () => {
  const cognitoMock = mockClient(CognitoIdentityProviderClient);
  const ddbMock = mockClient(DynamoDBDocumentClient);

  beforeEach(() => {
    cognitoMock.reset();
    ddbMock.reset();
    process.env.USER_POOL_ID = 'fake-pool';
    process.env.USERS_TABLE = 'users-test';
  });

  it('returns 401 when missing auth header', async () => {
    const res = await handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ email: 'a@b.com', role: 'patient' }) });
    expect(res.statusCode).toBe(401);
  });

  it('returns 409 if user exists in users table', async () => {
    // simulate a duplicate user
    ddbMock.on(ScanCommand).resolves({ Items: [{ email: 'dup@x.com' }], Count: 1 });

    const res = await handler({ httpMethod: 'POST', headers: { Authorization: 'Bearer ok-token' }, body: JSON.stringify({ email: 'dup@x.com', role: 'patient' }) });
    expect(res.statusCode).toBe(409);
  });

  it('creates a user when valid', async () => {
    // no duplicate
    ddbMock.on(ScanCommand).resolves({ Items: [], Count: 0 });
    cognitoMock.on(AdminCreateUserCommand).resolves({ User: { Username: 'newuser@example.com' } });
    ddbMock.on(PutCommand).resolves({});

    const payload = { email: 'newuser@example.com', role: 'patient', password: 'Pass1234!' };
    const res = await handler({ httpMethod: 'POST', headers: { Authorization: 'Bearer ok-token' }, body: JSON.stringify(payload) });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('userId');
    expect(body.email).toBe(payload.email);
    expect(body.role).toBe(payload.role);
  });
});

export {};
