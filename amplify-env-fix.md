# Amplify Environment Variables Fix

## Issue
Firebase initialization fails in Amplify because environment variables aren't loaded correctly.

## Solution
1. In Amplify Console, verify these environment variables are set:
   - NEXT_PUBLIC_FIREBASE_API_KEY
   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   - NEXT_PUBLIC_FIREBASE_PROJECT_ID
   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   - NEXT_PUBLIC_FIREBASE_APP_ID
   - NEXT_PUBLIC_USE_EMULATOR=false

2. Update build settings in Amplify Console:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
           - 'echo "Environment check"'
           - 'echo "API Key: $NEXT_PUBLIC_FIREBASE_API_KEY"'
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```

3. Redeploy the application