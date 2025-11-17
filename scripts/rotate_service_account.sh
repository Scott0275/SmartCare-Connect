#!/bin/bash

# Service Account Key Rotation Script
# Usage: ./rotate_service_account.sh [service-account-email] [project-id]

set -e

SERVICE_ACCOUNT=${1:-"smartcare-admin-sdk@smartcare-connect.iam.gserviceaccount.com"}
PROJECT_ID=${2:-$FIREBASE_PROJECT_ID}
KEY_FILE="new-service-account-key.json"

if [ -z "$PROJECT_ID" ]; then
    echo "Error: PROJECT_ID not provided"
    echo "Usage: $0 <service-account-email> <project-id>"
    exit 1
fi

echo "🔄 Starting service account key rotation..."
echo "Service Account: $SERVICE_ACCOUNT"
echo "Project: $PROJECT_ID"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "Error: No active gcloud authentication found"
    echo "Run: gcloud auth login"
    exit 1
fi

# Create new key
echo "Creating new service account key..."
gcloud iam service-accounts keys create "$KEY_FILE" \
    --iam-account="$SERVICE_ACCOUNT" \
    --project="$PROJECT_ID"

if [ $? -eq 0 ]; then
    echo "✅ New key created: $KEY_FILE"
    
    # Extract key content for environment variable
    KEY_CONTENT=$(cat "$KEY_FILE" | tr -d '\n')
    
    echo ""
    echo "🔧 Next steps:"
    echo "1. Update Vercel environment variables:"
    echo "   FIREBASE_ADMIN_PRIVATE_KEY_JSON=\"$KEY_CONTENT\""
    echo ""
    echo "2. Test the new key in staging environment"
    echo ""
    echo "3. List old keys to delete:"
    gcloud iam service-accounts keys list \
        --iam-account="$SERVICE_ACCOUNT" \
        --project="$PROJECT_ID"
    echo ""
    echo "4. Delete old keys after confirming new key works:"
    echo "   gcloud iam service-accounts keys delete [KEY-ID] --iam-account=$SERVICE_ACCOUNT --project=$PROJECT_ID"
    echo ""
    echo "⚠️  Remember to:"
    echo "   - Update all environments (prod, preview, dev)"
    echo "   - Test functionality after rotation"
    echo "   - Delete this local key file securely"
    echo ""
    echo "🗑️  To delete this file: rm $KEY_FILE"
    
else
    echo "❌ Key creation failed"
    exit 1
fi