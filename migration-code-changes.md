# Required Code Changes for AWS Migration

## 🔧 File-by-File Migration Guide

### 1. Authentication Layer Changes

#### Replace `lib/firebase.ts` with `lib/aws-config.ts`
```typescript
// lib/aws-config.ts
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

Amplify.configure(awsConfig);
export default awsConfig;
```

#### Update `context/AuthContext.tsx`
```typescript
// Replace Firebase imports with AWS Amplify
import { Auth } from 'aws-amplify';
import { CognitoUser } from '@aws-amplify/auth';

// Replace Firebase auth methods
const login = async (email: string, password: string) => {
  try {
    const user = await Auth.signIn(email, password);
    // Get user attributes including custom:role
    const userInfo = await Auth.currentUserInfo();
    const role = userInfo.attributes['custom:role'];
    setRole(role);
    // Redirect based on role...
  } catch (error) {
    throw error;
  }
};

const logout = async () => {
  await Auth.signOut();
  setUser(null);
  setRole(null);
  router.push('/login');
};
```

### 2. Database Layer Changes

#### Create `lib/dynamodb.ts`
```typescript
// lib/dynamodb.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ 
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

const docClient = DynamoDBDocumentClient.from(client);

export class DynamoDBService {
  async createDocument(tableName: string, item: any) {
    const command = new PutCommand({
      TableName: tableName,
      Item: { ...item, id: item.id || crypto.randomUUID(), createdAt: new Date().toISOString() }
    });
    return await docClient.send(command);
  }

  async getDocument(tableName: string, id: string) {
    const command = new GetCommand({
      TableName: tableName,
      Key: { id }
    });
    const result = await docClient.send(command);
    return result.Item;
  }

  async updateDocument(tableName: string, id: string, updates: any) {
    const updateExpression = Object.keys(updates).map(key => `#${key} = :${key}`).join(', ');
    const expressionAttributeNames = Object.keys(updates).reduce((acc, key) => ({ ...acc, [`#${key}`]: key }), {});
    const expressionAttributeValues = Object.keys(updates).reduce((acc, key) => ({ ...acc, [`:${key}`]: updates[key] }), {});

    const command = new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: `SET ${updateExpression}, updatedAt = :updatedAt`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: { ...expressionAttributeValues, ':updatedAt': new Date().toISOString() }
    });
    return await docClient.send(command);
  }

  async deleteDocument(tableName: string, id: string) {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: { id }
    });
    return await docClient.send(command);
  }

  async queryByIndex(tableName: string, indexName: string, keyCondition: any) {
    const command = new QueryCommand({
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: keyCondition.expression,
      ExpressionAttributeValues: keyCondition.values
    });
    const result = await docClient.send(command);
    return result.Items || [];
  }
}

export const dynamoService = new DynamoDBService();
```

#### Update Service Files (Example: `lib/patientService.ts`)
```typescript
// Replace Firestore imports
import { dynamoService } from './dynamodb';

// Replace Firestore calls
export async function createPatient(patientData: any) {
  return await dynamoService.createDocument('Patients', patientData);
}

export async function getPatient(patientId: string) {
  return await dynamoService.getDocument('Patients', patientId);
}

export async function updatePatient(patientId: string, updates: any) {
  return await dynamoService.updateDocument('Patients', patientId, updates);
}

export async function getPatientsByDoctor(doctorId: string) {
  return await dynamoService.queryByIndex('Patients', 'DoctorIndex', {
    expression: 'doctorId = :doctorId',
    values: { ':doctorId': doctorId }
  });
}
```

### 3. Storage Layer Changes

#### Create `lib/s3-storage.ts`
```typescript
// lib/s3-storage.ts
import { Storage } from 'aws-amplify';

export class S3StorageService {
  async uploadFile(file: File, key: string, options?: any) {
    try {
      const result = await Storage.put(key, file, {
        contentType: file.type,
        metadata: options?.metadata,
        ...options
      });
      return result.key;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  async downloadFile(key: string) {
    try {
      const result = await Storage.get(key, { download: true });
      return result;
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  async getFileUrl(key: string, expires: number = 3600) {
    try {
      const url = await Storage.get(key, { expires });
      return url;
    } catch (error) {
      console.error('Get URL failed:', error);
      throw error;
    }
  }

  async deleteFile(key: string) {
    try {
      await Storage.remove(key);
      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      throw error;
    }
  }
}

export const s3Storage = new S3StorageService();
```

### 4. API Layer Changes

#### Create Lambda Functions (Example: `lambda/patients.js`)
```javascript
// lambda/patients.js
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const { httpMethod, pathParameters, body } = event;
  
  try {
    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          return await getPatient(pathParameters.id);
        }
        return await getAllPatients();
      
      case 'POST':
        return await createPatient(JSON.parse(body));
      
      case 'PUT':
        return await updatePatient(pathParameters.id, JSON.parse(body));
      
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function getPatient(id) {
  const command = new GetCommand({
    TableName: 'Patients',
    Key: { id }
  });
  
  const result = await docClient.send(command);
  return {
    statusCode: 200,
    body: JSON.stringify(result.Item)
  };
}

async function createPatient(patientData) {
  const command = new PutCommand({
    TableName: 'Patients',
    Item: {
      ...patientData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }
  });
  
  await docClient.send(command);
  return {
    statusCode: 201,
    body: JSON.stringify({ message: 'Patient created successfully' })
  };
}
```

### 5. Environment Variables Update

#### New `.env.local` for AWS
```env
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=us-east-2:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_API_GATEWAY_URL=https://xxxxxxxxxx.execute-api.us-east-2.amazonaws.com/prod
NEXT_PUBLIC_S3_BUCKET=smartcare-medical-files

# AWS Credentials (for development only)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Feature Flags
NEXT_PUBLIC_USE_AWS=true
NEXT_PUBLIC_USE_FIREBASE=false
```

### 6. Package.json Updates

#### Add AWS Dependencies
```json
{
  "dependencies": {
    "aws-amplify": "^6.0.0",
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0",
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-amplify/auth": "^6.0.0",
    "@aws-amplify/storage": "^6.0.0"
  }
}
```

### 7. Offline Sync Engine Updates

#### Update `lib/syncEngine.ts` for DynamoDB
```typescript
// Replace Firebase imports with DynamoDB
import { dynamoService } from './dynamodb';

export async function syncPendingActions() {
  const actions = await getQueuedActions();
  
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'create':
          await dynamoService.createDocument(action.collection, action.payload);
          break;
        case 'update':
          await dynamoService.updateDocument(action.collection, action.docId, action.payload);
          break;
        case 'delete':
          await dynamoService.deleteDocument(action.collection, action.docId);
          break;
      }
      await removeQueuedAction(action.id);
    } catch (error) {
      console.error(`Sync failed for action ${action.id}:`, error);
    }
  }
}
```

## 📋 Migration Checklist

### Files to Update:
- [ ] `lib/firebase.ts` → `lib/aws-config.ts`
- [ ] `context/AuthContext.tsx`
- [ ] All service files in `lib/` directory
- [ ] `lib/syncEngine.ts`
- [ ] `lib/offlineDb.ts` (update sync targets)
- [ ] `package.json` (add AWS dependencies)
- [ ] `.env.local` (AWS environment variables)
- [ ] `next.config.js` (if needed for AWS configuration)

### New Files to Create:
- [ ] `lib/dynamodb.ts`
- [ ] `lib/s3-storage.ts`
- [ ] `lambda/` directory with serverless functions
- [ ] `terraform/modules/cognito/`
- [ ] `terraform/modules/dynamodb/`
- [ ] `terraform/modules/lambda/`

### Testing Strategy:
1. **Feature Flags**: Use environment variables to switch between Firebase and AWS
2. **Parallel Testing**: Run both systems simultaneously during migration
3. **Gradual Rollout**: Migrate one feature at a time
4. **Rollback Plan**: Keep Firebase as backup during initial AWS deployment