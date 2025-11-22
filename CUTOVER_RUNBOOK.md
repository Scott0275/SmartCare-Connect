# SmartCare Connect Go-Live Cutover Runbook

## 📋 Cutover Schedule

- **Cutover Date**: [Set deployment date]
- **Cutover Window**: 6:00 PM - 10:00 PM (4 hours)
- **Maintenance Window**: 5:00 PM - 11:00 PM (6 hours)
- **Timezone**: US Eastern

## 👥 Team Roster

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| Incident Commander | [Team Lead] | [Number] | [@lead] |
| Engineering Lead | [Engineer] | [Number] | [@engineer] |
| Database Lead | [DBA] | [Number] | [@dba] |
| Security Lead | [Security] | [Number] | [@security] |
| Product Manager | [PM] | [Number] | [@pm] |
| Communications | [Comms] | [Number] | [@comms] |

## Pre-Cutover (T-48 Hours)

### Friday Evening Checklist
- [ ] Backup all Firebase data
  ```bash
  # Export Firestore data
  gcloud firestore export gs://smartcare-connect-backup/firestore-$(date +%Y%m%d)
  
  # Backup Cloud Storage
  gsutil -m cp -r gs://smartcare-connect-bae0d.appspot.com/* \
    gs://smartcare-connect-backup/storage-$(date +%Y%m%d)/
  ```

- [ ] Verify AWS production environment is ready
  ```bash
  cd terraform/envs/prod
  terraform plan -out=prod.tfplan
  # Review plan - should show 0 changes if not modifying
  ```

- [ ] Run full E2E test suite
  ```bash
  npm test -- tests/e2e/ --coverage --verbose
  ```

- [ ] Verify all monitoring dashboards are live
  ```bash
  aws cloudwatch get-dashboard --dashboard-name smartcare-connect-prod
  ```

- [ ] Confirm team availability & notify stakeholders
  - [ ] Send calendar invites to all team members
  - [ ] Update status page with maintenance window notification
  - [ ] Email users about planned maintenance

### Saturday Morning Checklist (T-6 Hours)
- [ ] Final data migration dry-run
  ```bash
  ./scripts/migrate-firebase-to-dynamodb.sh --dry-run
  ```

- [ ] Verify DNS cutover plan
  - [ ] Current DNS: Firebase (amplify.smartcare.com → Firebase CDN)
  - [ ] New DNS: AWS (amplify.smartcare.com → CloudFront)
  - [ ] DNS record prepared, TTL lowered to 60 seconds

- [ ] Verify rollback plan is tested
  ```bash
  ./scripts/test-rollback.sh
  ```

- [ ] Gather connection strings & secrets
  - [ ] Cognito credentials
  - [ ] DynamoDB endpoints
  - [ ] API Gateway URL
  - [ ] S3 bucket names

---

## Cutover Day Timeline

### 5:00 PM - Pre-Cutover Meeting (T-60 Minutes)

**Incident Commander runs meeting:**
1. Review timeline & milestones
2. Confirm all systems are ready
3. Assign specific responsibilities
4. Establish communication protocol
5. Declare "Go" or "No-Go"

**No-Go Criteria:**
- Any critical test failures
- Unresolved security findings
- Incomplete data migration validation
- Team member unavailable

**Slack Channel**: #smartcare-cutover (all team members)

### 6:00 PM - Maintenance Window Begins (T-0)

#### Phase 1: Data Migration (6:00 - 6:30 PM)

**DBA Lead executes:**
```bash
# 1. Enable read-only mode on Firebase
firebase console → Settings → Authentication → Disable new users
# OR use feature flag in app

# 2. Migrate data from Firebase to DynamoDB
./scripts/migrate-firebase-to-dynamodb.sh --production

# 3. Verify migration
./scripts/verify-migration.sh
# Expected output:
# - Patients: 12,345 ✓
# - Appointments: 98,765 ✓
# - Users: 567 ✓
# - Total: 111,677 records

# 4. Backup migrated data
aws dynamodb create-backup \
  --table-name smartcare-connect-prod-patients \
  --backup-name smartcare-patients-pre-cutover-$(date +%Y%m%d-%H%M%S)
```

**Checkpoint**: All data migrated and verified ✓

---

#### Phase 2: DNS Cutover (6:30 - 7:00 PM)

**Infrastructure Lead executes:**
```bash
# 1. Test new DNS endpoint
curl -I https://api-prod.smartcare.com/health
# Expected: HTTP 200 OK

# 2. Update DNS record (change TTL to 60 seconds first)
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --change-batch file://dns-cutover.json

# Example dns-cutover.json:
# {
#   "Changes": [{
#     "Action": "UPSERT",
#     "ResourceRecordSet": {
#       "Name": "api.smartcare.com",
#       "Type": "CNAME",
#       "TTL": 60,
#       "ResourceRecords": [{
#         "Value": "d123456.cloudfront.net"
#       }]
#     }
#   }]
# }

# 3. Verify DNS propagation
dig api.smartcare.com +short
# Should return CloudFront IP, not Firebase

# 4. Monitor DNS change
watch 'dig api.smartcare.com +short'
```

**Checkpoint**: DNS pointing to AWS CloudFront ✓

---

#### Phase 3: Smoke Testing (7:00 - 7:30 PM)

**QA Lead executes smoke tests:**
```bash
# Run critical user journeys
npx jest tests/smoke/ --testNamePattern="critical" --verbose

# Expected results:
# ✓ User login (Cognito)
# ✓ View patient list
# ✓ Create appointment
# ✓ Upload medical file
# ✓ View analytics dashboard
# ✓ Logout
```

**Manual spot checks:**
- [ ] Open app in web browser: Does login work?
- [ ] Try creating a new appointment: Does it save to DynamoDB?
- [ ] Try uploading a file: Does S3 storage work?
- [ ] Check API response times: < 1 second?

**Checkpoint**: All critical functionality working ✓

---

#### Phase 4: Monitoring & Stabilization (7:30 - 9:00 PM)

**All team members monitor:**
```bash
# Watch Lambda errors
aws logs tail /aws/lambda/smartcare-connect-prod-patients \
  --follow --filter-pattern "ERROR"

# Watch DynamoDB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedWriteCapacityUnits \
  --dimensions Name=TableName,Value=smartcare-connect-prod-patients \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum

# Watch API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name 5XXError \
  --dimensions Name=ApiName,Value=smartcare-connect-prod \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum
```

**Alert Conditions** (trigger rollback if any occur):
- Lambda error rate > 5% (>100 errors in 10 minutes)
- DynamoDB read/write throttle events > 0
- API Gateway 5xx errors > 20 in 10 minutes
- User complaints of widespread outages

**Checkpoint**: System stable, monitoring clean ✓

---

### 9:00 PM - Success Declaration (T+180 Minutes)

**Incident Commander declares:**
- [ ] All critical functionality tested & working
- [ ] Error rates within acceptable range
- [ ] No user-reported issues
- [ ] Team confirms readiness for production

**Actions:**
```bash
# 1. Archive migration logs
tar -czf migration-logs-$(date +%Y%m%d-%H%M%S).tar.gz logs/

# 2. Send success notification
echo "🎉 SmartCare Connect successfully migrated to AWS!" | slack -c #announcements

# 3. Document cutover metrics
cat > cutover-report.md << 'EOF'
# Cutover Report

- **Start Time**: [timestamp]
- **End Time**: [timestamp]
- **Total Duration**: [minutes]
- **Records Migrated**: [count]
- **API Response Time (avg)**: [ms]
- **Error Rate**: [%]
- **Success**: ✓ Yes
EOF
```

### 9:00 PM - 11:00 PM - Extended Monitoring (T+180 to T+300 Minutes)

- [ ] Monitor error logs for any anomalies
- [ ] Monitor user feedback channels (email, support tickets)
- [ ] Verify 24-hour monitoring alerts are working
- [ ] Keep team available for rapid response

---

## ⚠️ Rollback Procedure (If Needed)

**Trigger Rollback If:**
- Critical user-facing outage lasting > 15 minutes
- Data corruption detected
- Unrecoverable error in Lambda/DynamoDB
- Security incident detected

**Rollback Steps (T+15 Minutes Window):**

### Step 1: Activate Incident Command (1 minute)
```bash
# Incident Commander takes lead
# Declare incident severity: CRITICAL
# Escalate to management
```

### Step 2: DNS Rollback (2 minutes)
```bash
# Revert DNS to Firebase
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --change-batch file://dns-rollback.json

# Verify rollback
dig api.smartcare.com +short
# Should return Firebase endpoint
```

### Step 3: Disable Feature Flags (2 minutes)
```bash
# Disable AWS integration in app
export USE_AWS_BACKEND=false

# Redeploy frontend
npm run build && npm run deploy
```

### Step 4: Verify Rollback (5 minutes)
```bash
# Test Firebase endpoints
curl -I https://smartcare-connect-bae0d.web.app/api/patients
# Expected: HTTP 200

# Verify data consistency
# Check Firebase Firestore has all original data
```

### Step 5: Post-Incident (After Service Restored)
```bash
# 1. Schedule post-mortem (next day)
# 2. Document root cause
# 3. Identify preventive measures
# 4. Plan retry cutover (next week)
```

---

## 📊 Success Criteria

| Metric | Target | Actual |
|--------|--------|--------|
| E2E Test Pass Rate | 100% | ___ |
| API p95 Latency | < 500ms | ___ |
| Lambda Error Rate | < 0.1% | ___ |
| DynamoDB Throttles | 0 | ___ |
| Data Migration Accuracy | 100% | ___ |
| User-Reported Issues | < 5 | ___ |

---

## 📞 Emergency Contacts

**If Critical Issue Occurs:**

1. **Slack**: @incident-commander in #smartcare-cutover
2. **Call**: [Team Lead Phone]
3. **Escalate to**: [Manager Phone]

---

## Post-Cutover (Next Day)

### Sunday Morning Checklist
- [ ] Review all logs for errors
- [ ] Confirm no data loss
- [ ] Verify all users able to access system
- [ ] Confirm no performance regressions
- [ ] Schedule post-mortem meeting
- [ ] Update go-live documentation

### Weekly Checklist
- [ ] Monitor cost tracking (should be ~$50-100/week)
- [ ] Review error logs & fix any issues
- [ ] Confirm scheduled backups are working
- [ ] Update runbook with lessons learned
- [ ] Plan decommissioning of Firebase resources (after 1 month)

---

**Last Updated**: November 21, 2025  
**Next Review**: Post-cutover
