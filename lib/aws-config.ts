import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID,
  },
  API: {
    endpoints: [
      {
        name: "smartcare-api",
        endpoint: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
        region: process.env.NEXT_PUBLIC_AWS_REGION
      }
    ]
  },
  Storage: {
    AWSS3: {
      bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
      region: process.env.NEXT_PUBLIC_AWS_REGION,
    }
  }
};

// Amplify.configure expects specific Amplify config typings; cast to any
Amplify.configure(awsConfig as any);
export default awsConfig;
