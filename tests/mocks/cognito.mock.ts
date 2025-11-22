import { 
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  InitiateAuthCommand,
  GetUserCommand,
  AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { mockClient } from 'aws-sdk-client-mock';

export const cognito = {
  client: new CognitoIdentityProviderClient({ region: 'us-east-2' }),
  mock: null as any,
};

cognito.mock = mockClient(CognitoIdentityProviderClient);

export const mockCognitoUser = {
  Username: 'testuser@example.com',
  UserPoolId: process.env.COGNITO_USER_POOL_ID || 'us-east-2_test123456',
  UserId: 'user-123',
  tempPassword: 'TempPass123!',
  permanentPassword: 'Password@123',
  email: 'testuser@example.com',
  givenName: 'Test',
  familyName: 'User',
  attributes: {
    email: 'testuser@example.com',
    given_name: 'Test',
    family_name: 'User',
    phone_number: '+1234567890',
  },
};

export const mockCognitoTokens = {
  AccessToken: 'mock-access-token-123',
  IdToken: 'mock-id-token-123',
  RefreshToken: 'mock-refresh-token-123',
  ExpiresIn: 3600,
};

export async function setupCognitoMock() {
  cognito.mock.on(AdminCreateUserCommand).resolves({
    User: {
      Username: mockCognitoUser.Username,
      UserAttributes: [
        { Name: 'email', Value: mockCognitoUser.email },
        { Name: 'given_name', Value: mockCognitoUser.givenName },
        { Name: 'family_name', Value: mockCognitoUser.familyName },
      ],
      UserStatus: 'FORCE_CHANGE_PASSWORD',
      UserCreateDate: new Date(),
      UserLastModifiedDate: new Date(),
    },
  });

  cognito.mock.on(AdminSetUserPasswordCommand).resolves({});

  cognito.mock.on(InitiateAuthCommand).resolves({
    AuthenticationResult: mockCognitoTokens,
  });

  cognito.mock.on(GetUserCommand).resolves({
    Username: mockCognitoUser.Username,
    UserAttributes: [
      { Name: 'email', Value: mockCognitoUser.email },
      { Name: 'given_name', Value: mockCognitoUser.givenName },
      { Name: 'family_name', Value: mockCognitoUser.familyName },
      { Name: 'email_verified', Value: 'true' },
    ],
    MFAOptions: [],
  });

  cognito.mock.on(AdminDeleteUserCommand).resolves({});
}

export function cleanupCognitoMock() {
  cognito.mock.restore();
}
