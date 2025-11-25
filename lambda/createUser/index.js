const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

function getCognitoClient() {
  const opts = {};
  if (process.env.JEST_WORKER_ID) {
    opts.credentials = { accessKeyId: 'test', secretAccessKey: 'test' };
    opts.region = process.env.AWS_REGION || 'us-east-2';
  }
  return new CognitoIdentityProviderClient(opts);
}

function getDynamoClient() {
  const opts = {};
  if (process.env.JEST_WORKER_ID) {
    opts.credentials = { accessKeyId: 'test', secretAccessKey: 'test' };
    opts.region = process.env.AWS_REGION || 'us-east-2';
  }
  return DynamoDBDocumentClient.from(new DynamoDBClient(opts));
}

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const USERS_TABLE = process.env.USERS_TABLE;

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Verify authorization
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const { email, password, role } = JSON.parse(event.body || '{}');

    if (!email || !role) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    // Create user in Cognito
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' }
      ],
      TemporaryPassword: password,
      MessageAction: 'SUPPRESS'
    });

    // Prevent duplicate users by checking DynamoDB Users table (if present)
    if (USERS_TABLE) {
      try {
        const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
        const scan = await getDynamoClient().send(new ScanCommand({ TableName: USERS_TABLE }));
        const exists = (scan.Items || []).some((u) => u.email === email);
        if (exists) {
          return { statusCode: 409, headers, body: JSON.stringify({ error: 'User already exists' }) };
        }
      } catch (scanErr) {
        // Log but continue - not fatal for create
        console.warn('Users table scan failed (createUser):', scanErr?.message || scanErr);
      }
    }

    const userResult = await getCognitoClient().send(createUserCommand);

    // Set permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true
    });

    await getCognitoClient().send(setPasswordCommand);

    // Save user role in DynamoDB
    const putCommand = new PutCommand({
      TableName: USERS_TABLE,
      Item: {
        id: userResult.User.Username,
        email,
        role,
        createdAt: new Date().toISOString()
      }
    });

    await getDynamoClient().send(putCommand);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        userId: userResult.User.Username,
        email,
        role
      })
    };

  } catch (error) {
    console.error('CreateUser error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};