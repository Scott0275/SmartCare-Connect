import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.test
const envFile = process.env.NODE_ENV === 'staging' 
  ? '.env.staging' 
  : '.env.test';

dotenv.config({ path: path.join(__dirname, '..', envFile) });

// Set default test environment variables
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-2';
process.env.DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'patients-table-test';
process.env.USERS_TABLE = process.env.USERS_TABLE || 'users-table-test';
process.env.APPOINTMENTS_TABLE = process.env.APPOINTMENTS_TABLE || 'appointments-table-test';
process.env.COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-2_test123456';
process.env.COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || 'test-client-id';
process.env.API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:3000/api';

// Ensure CloudFront domain used in tests matches expected test pattern
if (!process.env.CLOUDFRONT_DOMAIN || !/^d\w+\.cloudfront\.net$/.test(process.env.CLOUDFRONT_DOMAIN)) {
  process.env.CLOUDFRONT_DOMAIN = 'd123cloudfront.cloudfront.net';
}

// Note: do NOT disable health integration checks globally here so unit tests
// for health can still validate degraded cases. Each E2E test that needs the
// checks disabled should set DISABLE_HEALTH_INTEGRATION_CHECKS locally.

// Suppress debug logs during tests
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
  };
}

// NOTE: local API server is NOT started automatically here anymore.
// Starting the local server requires calling `require('../tests/localApiServer').start()`
// after mocks (Cognito/DynamoDB) are installed. This prevents race conditions
// where the server handles requests before aws-sdk-client-mock is configured.
