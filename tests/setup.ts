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

// Suppress debug logs during tests
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
  };
}
