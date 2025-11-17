# Security Overview

## Secrets Management

### Environment Variables (Vercel)
- `FIREBASE_ADMIN_PRIVATE_KEY` - Firebase Admin SDK private key
- `FIREBASE_ADMIN_CLIENT_EMAIL` - Service account email
- `FIREBASE_ADMIN_PROJECT_ID` - Firebase project ID
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Public Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `SENTRY_DSN` - Sentry error tracking DSN

### Access Rules
- **Admin/SuperAdmin**: Full system access, analytics, user management
- **Doctor**: Patient records, prescriptions, consultations, triage queue
- **Nurse**: Patient vitals, triage, basic records, appointments
- **Pharmacy**: Prescriptions, dispensations, inventory
- **LabTech**: Lab requests, results, imaging
- **Patient**: Own records, appointments, prescriptions (read-only)

### Key Rotation Plan
1. **Monthly**: Rotate Firebase service account keys
2. **Quarterly**: Review and rotate API keys
3. **Annually**: Full security audit and access review

### Security Controls
- Rate limiting: 100 requests/minute per IP
- Brute force protection: 5 failed attempts = 15min lockout
- Session timeout: 24 hours
- TLS 1.3 enforced
- CSP headers configured
- PHI data redaction in logs

## Incident Response
1. Detect: Sentry alerts, health check failures
2. Assess: Check logs, identify scope
3. Contain: Disable affected endpoints if needed
4. Recover: Deploy fix, verify functionality
5. Learn: Update security measures