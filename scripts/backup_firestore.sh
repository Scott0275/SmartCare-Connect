#!/bin/bash

# Firestore Backup Script
# Usage: ./backup_firestore.sh [project-id] [bucket-name]

set -e

PROJECT_ID=${1:-$FIREBASE_PROJECT_ID}
BUCKET_NAME=${2:-$BACKUP_BUCKET_NAME}
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_PATH="gs://$BUCKET_NAME/firestore-backups/$DATE"

if [ -z "$PROJECT_ID" ]; then
    echo "Error: PROJECT_ID not provided"
    echo "Usage: $0 <project-id> <bucket-name>"
    exit 1
fi

if [ -z "$BUCKET_NAME" ]; then
    echo "Error: BUCKET_NAME not provided"
    echo "Usage: $0 <project-id> <bucket-name>"
    exit 1
fi

echo "Starting Firestore backup..."
echo "Project: $PROJECT_ID"
echo "Destination: $BACKUP_PATH"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "Error: No active gcloud authentication found"
    echo "Run: gcloud auth login"
    exit 1
fi

# Create backup
echo "Creating backup..."
gcloud firestore export "$BACKUP_PATH" --project="$PROJECT_ID"

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully"
    echo "Location: $BACKUP_PATH"
    
    # Optional: Clean up old backups (keep last 30 days)
    echo "Cleaning up old backups..."
    OLD_DATE=$(date -d '30 days ago' +%Y%m%d 2>/dev/null || date -v-30d +%Y%m%d)
    gsutil -m rm -r "gs://$BUCKET_NAME/firestore-backups/$OLD_DATE"* 2>/dev/null || true
    
    echo "✅ Cleanup completed"
else
    echo "❌ Backup failed"
    exit 1
fi