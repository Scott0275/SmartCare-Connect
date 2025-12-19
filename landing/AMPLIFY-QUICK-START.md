# ⚡ Amplify Deployment Quick Start Checklist

## Phase 1: Preparation (15 minutes)

### GitHub Setup
- [ ] Ensure SmartCare-Connect repo exists on GitHub
- [ ] Push landing page files to main branch
- [ ] Verify files are in `landing/` subdirectory
- [ ] Confirm `script.js` has `/api/subscribe` endpoint

### AWS Account Setup
- [ ] AWS account created and billing enabled
- [ ] Logged into AWS Console
- [ ] Switched to appropriate region (us-east-1 recommended)

---

## Phase 2: Amplify Deployment (10 minutes)

### Deploy Frontend

1. **Open Amplify Console**
   - URL: https://console.aws.amazon.com/amplify/

2. **Create New App**
   - Click "Create app" → "Deploy an app"
   - Choose "GitHub" 
   - Authorize Amplify
   - Select your repository
   - Select branch: `main`

3. **Configure Build**
   - App root directory: `landing/`
   - Build settings: Keep defaults
   - Click "Save and deploy"

4. **Wait for Deployment**
   - Status: "Creating" → "Building" → "Verifying" → "Deployed"
   - Takes 1-2 minutes
   - You'll get a URL: `https://main.xxxxx.amplifyapp.com`

✅ **Frontend deployed!**

---

## Phase 3: Email Backend Setup (20 minutes)

### Create Lambda Function

1. **Open Lambda Console**
   - URL: https://console.aws.amazon.com/lambda/

2. **Create Function**
   - Click "Create function"
   - Name: `smartcare-landing-subscribe`
   - Runtime: Node.js 18.x
   - Execution role: Create basic Lambda role
   - Click "Create function"

3. **Add Code**
   - Copy entire code from `amplify-lambda-subscribe.js`
   - Paste into Lambda editor
   - Delete existing code first
   - Click "Deploy"

4. **Add Environment Variables**
   - Go to "Configuration" tab
   - Click "Environment variables"
   - Click "Edit"
   - Add:
     ```
     NOTIFICATION_EMAIL: techwithbuchi@gmail.com
     DYNAMODB_TABLE: smartcare-early-access
     ```
   - Click "Save"

5. **Add Permissions**
   - Go to "Configuration" → "Permissions"
   - Click the role name (opens IAM)
   - Click "Add inline policy"
   - Create policy with:
     - Service: DynamoDB, Actions: All
     - Service: SES, Actions: SendEmail
   - Attach to role

✅ **Lambda function ready!**

### Create DynamoDB Table

1. **Open DynamoDB Console**
   - URL: https://console.aws.amazon.com/dynamodbv2/

2. **Create Table**
   - Click "Create table"
   - Table name: `smartcare-early-access`
   - Partition key: `email` (String)
   - Billing: On-demand
   - Create table

✅ **DynamoDB table ready!**

### Setup SES (Email Service)

1. **Open SES Console**
   - URL: https://console.aws.amazon.com/ses/

2. **Verify Email Addresses**
   - Verified identities → Email addresses
   - Verify sender: `noreply@smartcare.example` (or your domain)
   - Verify recipient: `techwithbuchi@gmail.com`
   - Confirm links in email inbox

3. **Request Production Access**
   - Account dashboard
   - Request production access
   - Usually approved in 24 hours
   - Can test in sandbox mode initially

✅ **Email service ready!**

---

## Phase 4: API Gateway Setup (15 minutes)

### Create REST API

1. **Open API Gateway Console**
   - URL: https://console.aws.amazon.com/apigateway/

2. **Create API**
   - Click "Create API" → "REST API"
   - Name: `smartcare-landing-api`
   - Click "Create API"

3. **Create Resources**

   **Create `/api` resource:**
   - Right-click "/" → "Create Resource"
   - Name: `api`
   - Click "Create Resource"

   **Create `/subscribe` resource:**
   - Right-click "/api" → "Create Resource"
   - Name: `subscribe`
   - Click "Create Resource"

4. **Create POST Method**
   - Select `/api/subscribe`
   - Click "Create method" → "POST"
   - Integration type: Lambda Function
   - Function: `smartcare-landing-subscribe`
   - Click "Create"

5. **Enable CORS**
   - Select `/api/subscribe`
   - Click "Enable CORS"
   - Default settings OK
   - Click "Enable CORS and replace CORS headers"

6. **Deploy API**
   - Click "Deploy API"
   - Stage: `prod`
   - Click "Deploy"
   - **Note your endpoint URL**: `https://xxxxx.execute-api.region.amazonaws.com/prod`

✅ **API Gateway ready!**

---

## Phase 5: Testing (10 minutes)

### Test Email Form

1. **Open Your Landing Page**
   - Visit: `https://main.xxxxx.amplifyapp.com`
   - Scroll to bottom CTA section

2. **Test Form Submission**
   - Enter email: `test@yourmail.com`
   - Click "Get Early Access"
   - Should show success message

3. **Verify Email Received**
   - Check techwithbuchi@gmail.com inbox
   - Should receive notification
   - Check spam folder if not in inbox

4. **Verify Data Stored**
   - Go to DynamoDB console
   - Select `smartcare-early-access` table
   - Should see email entry
   - Check timestamp and status

5. **Test Error Handling**
   - Try invalid email: `invalid-email`
   - Should show error message
   - Try empty submission
   - Should show validation error

✅ **Everything working!**

---

## Phase 6: Production Configuration (Optional, 10 minutes)

### Custom Domain

1. **Add Custom Domain to Amplify**
   - Amplify Console → Domain management
   - Click "Add domain"
   - Enter: `landing.smartcare.example`
   - Add DNS records to your registrar
   - Wait 24-48 hours

### Monitoring

1. **Enable CloudWatch Alarms**
   - CloudWatch → Alarms
   - Create alarm for Lambda errors
   - Set notification email

2. **Monitor SES Sending Quota**
   - SES Console → Account dashboard
   - Check daily sending limit
   - Request increase if needed

---

## 📊 Verification Checklist

After completing all phases:

- [ ] Amplify app deployed and accessible
- [ ] Landing page loads without errors
- [ ] Email form submits successfully
- [ ] Notification email received at techwithbuchi@gmail.com
- [ ] Confirmation email received by subscriber
- [ ] Email stored in DynamoDB
- [ ] No errors in CloudWatch logs
- [ ] Invalid emails show error message
- [ ] CORS headers working correctly
- [ ] SSL/HTTPS enabled

---

## 🎯 Next Actions

### Immediate
1. Share landing page link on social media
2. Monitor first email signups
3. Test with real emails

### This Week
1. Set up Google Analytics (optional)
2. Add custom domain
3. Update email templates
4. Enable production SES access

### This Month
1. Monitor metrics
2. Optimize email copy
3. A/B test CTA button
4. Scale based on demand

---

## 💰 Cost Breakdown

| Service | Free Tier | After |
|---------|-----------|-------|
| Amplify | 5GB/month | ~$1-5 |
| Lambda | 1M/month | ~$0.20 |
| SES | 62K/month | ~$0.10 |
| DynamoDB | 25GB/month | ~$1-2 |
| **Total** | **Free** | **~$3-8** |

---

## 🚀 Success Indicators

You'll know it's working when:

✅ Landing page loads in <3 seconds  
✅ Email form submits without errors  
✅ Emails appear in techwithbuchi@gmail.com inbox  
✅ Data appears in DynamoDB within seconds  
✅ CloudWatch shows successful Lambda invocations  
✅ No errors in logs  

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Form won't submit | Check API endpoint in script.js, verify CORS enabled |
| 403 error | Verify Lambda has SES/DynamoDB permissions |
| Email not received | Check SES sandbox vs production, verify email verified |
| 500 error | Check CloudWatch logs for Lambda errors |
| Data not in DB | Verify table name in Lambda env vars |

---

## 📞 Support

**Estimated Time**: 1-2 hours total  
**Difficulty**: Beginner-friendly  
**Success Rate**: 99% if following this guide  

For issues:
- Check CloudWatch logs: https://console.aws.amazon.com/cloudwatch/
- Review Lambda function: https://console.aws.amazon.com/lambda/
- Test API endpoint: Use Postman or curl

---

**You've got this! 🎉 Your SmartCare landing page is going live!**

```
Timeline:
00:00 - Start
00:15 - Frontend deployed
00:30 - Lambda + DynamoDB ready
00:45 - API Gateway configured
01:00 - Testing complete
01:15 - Done! 🚀
```
