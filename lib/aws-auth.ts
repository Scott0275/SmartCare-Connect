import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand, AdminCreateUserCommand, AdminSetUserPasswordCommand } from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2'
});

const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!;
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || 'b4c8a0r60vqh2b75d62ivckhj'; // allow env override for staging/production

export interface CognitoUser {
  username: string;
  email: string;
  uid: string;
  role?: string;
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export class AWSAuthService {
  async signIn(email: string, password: string): Promise<CognitoUser> {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await cognitoClient.send(command);
    
    if (!response.AuthenticationResult) {
      throw new Error('Authentication failed');
    }

    const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;
    
    // Decode ID token to get user info
    const idTokenPayload = JSON.parse(atob(IdToken!.split('.')[1]));
    
    // Prefer explicit custom:role, fall back to cognito:groups (first group) when present
    const roleFromGroups = Array.isArray(idTokenPayload['cognito:groups']) ? idTokenPayload['cognito:groups'][0] : undefined;

    return {
      username: idTokenPayload.email,
      uid: idTokenPayload.email,
      email: idTokenPayload.email,
      role: idTokenPayload['custom:role'] || roleFromGroups,
      accessToken: AccessToken!,
      idToken: IdToken!,
      refreshToken: RefreshToken!,
    };
  }

  async signUp(email: string, password: string, role: string): Promise<void> {
    const command = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'custom:role', Value: role },
      ],
    });

    await cognitoClient.send(command);
  }

  async confirmSignUp(email: string, confirmationCode: string): Promise<void> {
    const command = new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
    });

    await cognitoClient.send(command);
  }

  async createUser(email: string, password: string, role: string): Promise<void> {
    // Admin create user (for admin creating other users)
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'custom:role', Value: role },
        { Name: 'email_verified', Value: 'true' },
      ],
      MessageAction: 'SUPPRESS',
      TemporaryPassword: password,
    });

    await cognitoClient.send(createCommand);

    // Set permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    });

    await cognitoClient.send(setPasswordCommand);
  }

  decodeToken(token: string) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) return true;
    return decoded.exp * 1000 < Date.now();
  }
}

export const awsAuth = new AWSAuthService();