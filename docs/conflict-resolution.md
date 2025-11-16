# Conflict Resolution Guide

## Overview

The SmartCare Connect system includes an offline-first architecture that allows users to work without internet connectivity. When users come back online, their changes are automatically synced. However, conflicts can occur when the same data is modified both offline and online.

## How Conflicts Happen

1. **User A** edits a patient record while offline
2. **User B** edits the same patient record while online
3. **User A** comes back online and their changes attempt to sync
4. The system detects a conflict because both versions have been modified
5. A conflict record is created for admin review

## Admin Workflow

### 1. View Conflicts Dashboard
- Navigate to `/admin/conflicts`
- Filter by status (pending/resolved/ignored)
- Filter by collection type (patients/billing/prescriptions/visits)
- See summary of each conflict

### 2. Review Individual Conflicts
- Click "Review" on any conflict
- See side-by-side comparison of server vs offline data
- View metadata: user, timestamp, attempts

### 3. Resolution Options

#### Apply Offline Data
- Overwrites server data with offline changes
- Use when offline changes are more accurate/complete

#### Ignore Conflict
- Keeps server data unchanged
- Use when server data should be preserved

#### Export for Audit
- Downloads conflict as JSON file
- Use for record-keeping or external review

### 4. Add Resolution Notes
- Always add a note explaining the resolution decision
- Notes are stored in audit logs for future reference

## Example Scenarios

### Scenario 1: Patient Information Update
- **Offline**: Nurse updates patient phone number
- **Online**: Doctor updates patient address
- **Resolution**: Apply offline data (both changes are valid)

### Scenario 2: Billing Conflict
- **Offline**: Nurse adds billing items
- **Online**: Admin marks bill as paid
- **Resolution**: Merge both changes or review manually

### Scenario 3: Prescription Conflict
- **Offline**: Doctor creates prescription
- **Online**: Same doctor creates different prescription
- **Resolution**: Review both prescriptions, may need manual intervention

## Audit Trail

All conflict resolutions are logged in the audit system:
- Who resolved the conflict
- What action was taken
- Before/after data snapshots
- Resolution notes

Access audit logs at `/admin/audit`

## Notifications

When conflicts are resolved:
- Original user receives notification
- Notification explains what happened to their changes
- Users can view notifications via the bell icon

## Best Practices

1. **Review conflicts promptly** to prevent data inconsistencies
2. **Always add resolution notes** for audit purposes
3. **Export complex conflicts** for detailed review
4. **Communicate with users** about significant changes
5. **Monitor audit logs** regularly for patterns

## Export and Backup

- Individual conflicts can be exported as JSON
- Audit logs provide complete history
- Use exports for compliance and record-keeping