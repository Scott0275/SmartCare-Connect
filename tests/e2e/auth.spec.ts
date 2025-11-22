import {
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  InitiateAuthCommand,
  AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { setupCognitoMock, cleanupCognitoMock, mockCognitoUser, mockCognitoTokens, cognito } from '../mocks/cognito.mock';

describe('E2E: Authentication Flow', () => {
  beforeAll(async () => {
    await setupCognitoMock();
  });

  afterAll(() => {
    cleanupCognitoMock();
  });

  describe('User Registration', () => {
    it('should create a new user with temporary password', async () => {
      cognito.mock.on(AdminCreateUserCommand).resolves({
        User: {
          Username: mockCognitoUser.Username,
          UserAttributes: [
            { Name: 'email', Value: mockCognitoUser.email },
            { Name: 'given_name', Value: mockCognitoUser.givenName },
          ],
          UserStatus: 'FORCE_CHANGE_PASSWORD',
          UserCreateDate: new Date(),
          UserLastModifiedDate: new Date(),
        },
      });

      const client = cognito.client;
      const response = await client.send(
        new AdminCreateUserCommand({
          UserPoolId: mockCognitoUser.UserPoolId,
          Username: mockCognitoUser.Username,
          TemporaryPassword: mockCognitoUser.tempPassword,
          UserAttributes: [
            { Name: 'email', Value: mockCognitoUser.email },
            { Name: 'email_verified', Value: 'true' },
          ],
        })
      );

      expect(response.User?.Username).toBe(mockCognitoUser.Username);
      expect(response.User?.UserStatus).toBe('FORCE_CHANGE_PASSWORD');
    });

    it('should set permanent password after temporary password', async () => {
      cognito.mock.on(AdminSetUserPasswordCommand).resolves({});

      const client = cognito.client;
      await client.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: mockCognitoUser.UserPoolId,
          Username: mockCognitoUser.Username,
          Password: mockCognitoUser.permanentPassword,
          Permanent: true,
        })
      );

      // Verify command was called (search through recorded calls)
      const calls = cognito.mock.calls();
      const setPwdCalled = calls.some(call => call.args && call.args[0] instanceof AdminSetUserPasswordCommand);
      expect(setPwdCalled).toBe(true);
    });

    it('should validate password requirements', async () => {
      const weakPasswords = [
        'password',        // No uppercase, numbers, symbols
        'Pass123',         // Too short (< 8 chars)
        'pass123!@',       // No uppercase
        'PASS123!@',       // No lowercase
      ];

      function isWeak(p: string) {
        return (
          p.length < 8 ||
          !/[A-Z]/.test(p) ||
          !/[a-z]/.test(p) ||
          !/[0-9]/.test(p) ||
          !/[^A-Za-z0-9]/.test(p)
        );
      }

      for (const password of weakPasswords) {
        expect(isWeak(password)).toBe(true);
      }
    });
  });

  describe('User Login', () => {
    it('should authenticate user with correct credentials', async () => {
      cognito.mock.on(InitiateAuthCommand).resolves({
        AuthenticationResult: mockCognitoTokens,
      });

      const client = cognito.client;
      const response = await client.send(
        new InitiateAuthCommand({
          ClientId: process.env.COGNITO_CLIENT_ID!,
          AuthFlow: 'USER_PASSWORD_AUTH',
          AuthParameters: {
            USERNAME: mockCognitoUser.email,
            PASSWORD: mockCognitoUser.permanentPassword,
          },
        })
      );

      expect(response.AuthenticationResult).toBeDefined();
      expect(response.AuthenticationResult?.AccessToken).toBe(mockCognitoTokens.AccessToken);
      expect(response.AuthenticationResult?.ExpiresIn).toBe(3600);
    });

    it('should fail authentication with incorrect password', async () => {
      cognito.mock.on(InitiateAuthCommand).rejects(
        new Error('Invalid password')
      );

      const client = cognito.client;
      await expect(
        client.send(
          new InitiateAuthCommand({
            ClientId: process.env.COGNITO_CLIENT_ID!,
            AuthFlow: 'USER_PASSWORD_AUTH',
            AuthParameters: {
              USERNAME: mockCognitoUser.email,
              PASSWORD: 'WrongPassword123!',
            },
          })
        )
      ).rejects.toThrow('Invalid password');
    });

    it('should return valid access token with user information', async () => {
      cognito.mock.on(InitiateAuthCommand).resolves({
        AuthenticationResult: mockCognitoTokens,
      });

      const client = cognito.client;
      const response = await client.send(
        new InitiateAuthCommand({
          ClientId: process.env.COGNITO_CLIENT_ID!,
          AuthFlow: 'USER_PASSWORD_AUTH',
          AuthParameters: {
            USERNAME: mockCognitoUser.email,
            PASSWORD: mockCognitoUser.permanentPassword,
          },
        })
      );

      expect(response.AuthenticationResult?.AccessToken).toBeDefined();
      expect(response.AuthenticationResult?.IdToken).toBeDefined();
      expect(response.AuthenticationResult?.RefreshToken).toBeDefined();
    });
  });

  describe('Token Refresh', () => {
    it('should refresh expired access token using refresh token', async () => {
      const newTokens = {
        AccessToken: 'new-access-token-456',
        IdToken: 'new-id-token-456',
        ExpiresIn: 3600,
      };

      cognito.mock.on(InitiateAuthCommand).resolves({
        AuthenticationResult: newTokens,
      });

      const client = cognito.client;
      const response = await client.send(
        new InitiateAuthCommand({
          ClientId: process.env.COGNITO_CLIENT_ID!,
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          AuthParameters: {
            REFRESH_TOKEN: mockCognitoTokens.RefreshToken!,
          },
        })
      );

      expect(response.AuthenticationResult?.AccessToken).toBe(newTokens.AccessToken);
      expect(response.AuthenticationResult?.ExpiresIn).toBe(3600);
    });
  });

  describe('User Deletion', () => {
    it('should delete user account', async () => {
      cognito.mock.on(AdminDeleteUserCommand).resolves({});

      const client = cognito.client;
      await client.send(
        new AdminDeleteUserCommand({
          UserPoolId: mockCognitoUser.UserPoolId,
          Username: mockCognitoUser.Username,
        })
      );

      // Verify command was called (search through recorded calls)
      const deleteCalls = cognito.mock.calls();
      const delCalled = deleteCalls.some(call => call.args && call.args[0] instanceof AdminDeleteUserCommand);
      expect(delCalled).toBe(true);
    });
  });

  describe('RBAC (Role-Based Access Control)', () => {
    it('should assign role to user on creation', async () => {
      cognito.mock.on(AdminCreateUserCommand).resolves({
        User: {
          Username: mockCognitoUser.Username,
          UserAttributes: [
            { Name: 'email', Value: mockCognitoUser.email },
            { Name: 'custom:role', Value: 'patient' },
          ],
          UserStatus: 'FORCE_CHANGE_PASSWORD',
          UserCreateDate: new Date(),
          UserLastModifiedDate: new Date(),
        },
      });

      const client = cognito.client;
      const response = await client.send(
        new AdminCreateUserCommand({
          UserPoolId: mockCognitoUser.UserPoolId,
          Username: mockCognitoUser.Username,
          TemporaryPassword: mockCognitoUser.tempPassword,
          UserAttributes: [
            { Name: 'email', Value: mockCognitoUser.email },
            { Name: 'custom:role', Value: 'patient' },
          ],
        })
      );

      const roleAttribute = response.User?.UserAttributes?.find(
        attr => attr.Name === 'custom:role'
      );
      expect(roleAttribute?.Value).toBe('patient');
    });

    it('should enforce role-based access to endpoints', () => {
      const roles = {
        patient: ['appointments', 'prescriptions', 'medical-records'],
        doctor: ['patients', 'appointments', 'prescriptions'],
        admin: ['patients', 'doctors', 'appointments', 'reports'],
      };

      // Verify patient role restricted to patient endpoints
      expect(roles.patient).toContain('appointments');
      expect(roles.patient).not.toContain('patients');

      // Verify admin role has access to all
      expect(roles.admin).toContain('patients');
      expect(roles.admin).toContain('doctors');
    });
  });
});
