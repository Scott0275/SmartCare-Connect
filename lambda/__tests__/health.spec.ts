const { handler } = require('../../lambda/health/index.js');
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

describe('Lambda: health', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);
  const s3Mock = mockClient(S3Client);

  beforeEach(() => {
    ddbMock.reset();
    s3Mock.reset();
    delete process.env.DYNAMODB_TABLE;
    delete process.env.S3_BUCKET;
    delete process.env.COGNITO_USER_POOL_ID;
  });

  it('returns ok when no external integrations configured', async () => {
    const res = await handler({ httpMethod: 'GET', headers: {} });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('service');
  });

  it('reports a degraded status when DynamoDB fails', async () => {
    process.env.DYNAMODB_TABLE = 'patients-test';
    ddbMock.onAnyCommand().rejects(new Error('Dynamo error'));

    const res = await handler({ httpMethod: 'GET', headers: {} });
    expect([200, 500]).toContain(res.statusCode);
    const body = JSON.parse(res.body);
    expect(body.checks.dynamo.ok).toBe(false);
    expect(body.status).toBe('degraded');
  });

  it('reports s3 failure when HeadBucket fails', async () => {
    process.env.S3_BUCKET = 'bucket-test';
    s3Mock.on(HeadBucketCommand).rejects(new Error('No such bucket'));

    const res = await handler({ httpMethod: 'GET', headers: {} });
    const body = JSON.parse(res.body);
    expect(body.checks.s3.ok).toBe(false);
  });
});

export {};
