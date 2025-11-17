# IAM Audit Report

## Firebase Service Accounts

### smartcare-admin-sdk@smartcare-connect.iam.gserviceaccount.com
- **Purpose**: Server-side Firebase Admin SDK operations
- **Permissions**: 
  - Firebase Admin SDK Service Agent
  - Cloud Datastore User (for Firestore)
- **Key Rotation**: Last rotated [DATE], next due [DATE+30d]
- **Usage**: API routes, server-side auth verification
- **Risk Level**: HIGH - Has full Firestore access

### Recommendations
1. ✅ Remove unused service accounts
2. ✅ Implement key rotation schedule
3. ✅ Monitor service account usage
4. ⚠️ Consider separate service accounts per environment

## Vercel Team Access

### Current Members
- **Owner**: [OWNER_EMAIL] - Full deployment and settings access
- **Member**: [MEMBER_EMAIL] - Deploy and environment variable access

### Environment Variable Access
- **Production**: Owner only
- **Preview**: Owner + Members
- **Development**: Owner + Members

### Recommendations
1. ✅ Limit production environment access
2. ✅ Regular access review (quarterly)
3. ✅ Use deployment protection rules
4. ✅ Enable audit logging

## GitHub Repository Access

### Branch Protection
- **main**: Requires PR review, status checks
- **develop**: Requires status checks
- **feature/***: No restrictions

### Secrets
- `VERCEL_TOKEN` - Deployment automation
- `FIREBASE_SERVICE_ACCOUNT` - CI/CD Firebase access

### Recommendations
1. ✅ Enable branch protection on main
2. ✅ Require signed commits
3. ✅ Regular dependency updates
4. ✅ Security scanning enabled

## Risk Assessment

### High Risk
- Firebase Admin SDK key compromise
- Vercel production environment access
- GitHub repository admin access

### Medium Risk
- API rate limit bypass
- Session hijacking
- Dependency vulnerabilities

### Low Risk
- Client-side configuration exposure
- Development environment access

## Action Items
1. Rotate Firebase service account keys monthly
2. Implement least privilege access reviews
3. Enable additional monitoring and alerting
4. Document incident response procedures