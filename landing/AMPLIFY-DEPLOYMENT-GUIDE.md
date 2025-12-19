# SmartCare Landing Page - Amplify Deployment with Email Backend

## 📋 Prerequisites

Before deploying, you'll need:

1. **AWS Account** - With billing enabled
2. **GitHub Account** - Repository containing SmartCare-Connect
3. **AWS CLI** - Installed and configured (optional, but helpful)
4. **Git** - For pushing code to GitHub

---

## 🔧 Step 1: Prepare Your Repository

### 1.1 Push Landing Page to GitHub

```bash
# From project root
cd c:\Projects\SmartCare-Connect

# Initialize git if not already done
git init

# Add Amplify configuration files
git add landing/amplify.yml
git add landing/amplify-lambda-subscribe.js
git add landing/script.js

# Commit changes
git commit -m "Configure Amplify deployment with email backend"

# Push to main branch
git push origin main
```

### 1.2 Verify GitHub Repository

Ensure your GitHub repository contains:
```
SmartCare-Connect/
├── landing/
│   ├── index.html
│   ├── styles.css
│   ├── script.js (updated with /api/subscribe)
│   ├── amplify.yml
│   └── amplify-lambda-subscribe.js
└── ... (other project files)
```

---

## 🚀 Step 2: Create Amplify App

### Option A: Using AWS Console (Recommended for First Time)

1. **Go to AWS Amplify**
   - Navigate to: https://console.aws.amazon.com/amplify
   - Click "Create app" → "Deploy an app"

2. **Connect to GitHub**
   - Select "GitHub" as your repository
   - Click "Connect branch"
   - Authorize Amplify to access your GitHub
   - Select your repository: `yourusername/SmartCare-Connect`
   - Select branch: `main`

3. **Configure Build Settings**
   - For app root directory, select: `landing`
   - Build settings should show:
     ```yaml
     version: 1
     frontend:
       phases:
         build:
           commands:
             - echo "Landing page is static"
       artifacts:
         baseDirectory: .
     ```
   - Click "Save and deploy"

4. **Wait for Initial Deployment**
   - Should complete in 1-2 minutes
   - You'll get a temporary URL like: `https://main.xxxxx.amplifyapp.com`

### Option B: Using AWS CLI

```bash
# Install AWS Amplify CLI
npm install -g @aws-amplify/cli

# Configure AWS credentials
amplify configure

# Initialize Amplify in your project
cd c:\Projects\SmartCare-Connect\landing
amplify init

# Follow prompts:
# - Project name: smartcare-landing
# - Environment: dev
# - Default editor: Visual Studio Code
# - App type: javascript
# - JavaScript framework: none
# - Source dir: .
# - Distribution dir: .
# - Build command: echo "Static site"
# - Start command: npx http-server .

# Deploy
amplify publish
```

---

## 📧 Step 3: Configure Email Backend

### 3.1 Set Up AWS SES (Simple Email Service)

1. **Request SES Production Access**
   - Go to: https://console.aws.amazon.com/ses/
   - Verify your sender email: `noreply@yourcompany.com`
   - Request production access (usually approved in 24 hours)

2. **Verify Recipient Email**
   ```
   Domain: techwithbuchi@gmail.com
   Click "Verify Email Address"
   Confirm the link in your email inbox
   ```

### 3.2 Deploy Lambda Function

1. **Create Lambda Function in AWS Console**
   - Go to: https://console.aws.amazon.com/lambda/
   - Click "Create function"
   - Name: `smartcare-landing-subscribe`
   - Runtime: `Node.js 18.x` or later
   - Role: Create new role with basic Lambda permissions

2. **Add Environment Variables**
   - Go to: Configuration → Environment variables
   - Add:
     ```
     NOTIFICATION_EMAIL: techwithbuchi@gmail.com
     DYNAMODB_TABLE: smartcare-early-access
     ```

3. **Add DynamoDB Permissions to Lambda Role**
   - Go to: Configuration → Permissions
   - Click the role name
   - Add inline policy: `AmazonDynamoDBFullAccess`
   - Add inline policy: `AmazonSESFullAccess`

4. **Add Code**
   - Copy code from `amplify-lambda-subscribe.js`
   - Paste into Lambda editor
   - Click "Deploy"

### 3.3 Create DynamoDB Table

1. **Create Table in DynamoDB**
   - Go to: https://console.aws.amazon.com/dynamodbv2/
   - Click "Create table"
   - Table name: `smartcare-early-access`
   - Partition key: `email` (String)
   - Billing: On-demand
   - Create table

---

## 🔗 Step 4: Connect API Gateway

### 4.1 Create API Gateway Endpoint

1. **Create API**
   - Go to: https://console.aws.amazon.com/apigateway/
   - Click "Create API" → "REST API"
   - Name: `smartcare-landing-api`
   - Click "Create API"

2. **Create /api Resource**
   - Right-click "/" → "Create Resource"
   - Resource name: `api`
   - Click "Create Resource"

3. **Create /subscribe Sub-Resource**
   - Right-click "/api" → "Create Resource"
   - Resource name: `subscribe`
   - Click "Create Resource"

4. **Create POST Method**
   - Select `/api/subscribe`
   - Click "Create method" → "POST"
   - Integration type: "Lambda Function"
   - Lambda region: Your region (us-east-1, etc.)
   - Lambda function: Select `smartcare-landing-subscribe`
   - Click "Create"

5. **Enable CORS**
   - Select `/api/subscribe`
   - Click "Enable CORS"
   - Default settings OK
   - Click "Enable CORS and replace CORS headers"

6. **Deploy API**
   - Click "Deploy API"
   - Deployment stage: `prod`
   - Click "Deploy"
   - Note your API endpoint: `https://xxxxx.execute-api.region.amazonaws.com/prod`

### 4.2 Connect to Amplify Frontend

1. **Update Amplify Custom Domain**
   - Go to: https://console.aws.amazon.com/amplify/
   - Select your app → Domain management
   - Add custom domain (optional): `landing.smartcare.example`

2. **Add Environment Variable for API Gateway URL**
   - Go to: App settings → Environment variables
   - Add:
     ```
     REACT_APP_API_URL: https://xxxxx.execute-api.region.amazonaws.com/prod
     ```

3. **Update Landing Page (If Using Environment Variable)**
   - Edit `landing/script.js`:
     ```javascript
     emailServiceUrl: process.env.REACT_APP_API_URL + '/api/subscribe' || '/api/subscribe',
     ```

---

## 🧪 Step 5: Test the Setup

### 5.1 Test Email Form

1. **Visit Your Amplify App**
   - Go to: `https://main.xxxxx.amplifyapp.com`

2. **Fill Email Form**
   - Scroll to bottom (CTA section)
   - Enter test email: `test@example.com`
   - Click "Get Early Access"

3. **Check Results**
   - Should see success message
   - Check techwithbuchi@gmail.com inbox
   - Should receive notification email

4. **Verify DynamoDB Entry**
   - Go to: AWS DynamoDB console
   - Select `smartcare-early-access` table
   - Should see the email stored

### 5.2 Test Error Handling

1. **Invalid Email**
   - Try submitting: `invalid-email`
   - Should show error: "Please enter a valid email"

2. **Empty Email**
   - Try submitting without email
   - Should show error: "Please enter a valid email"

---

## 🎯 Step 6: Production Configuration

### 6.1 Custom Domain

1. **Configure Custom Domain**
   - Go to: Amplify Console → Domain management
   - Click "Add domain"
   - Enter: `landing.smartcare.example`
   - Add DNS records to your registrar
   - Wait 24-48 hours for propagation

2. **Set Up SSL/HTTPS**
   - Amplify handles SSL automatically
   - Certificate auto-renewed annually

### 6.2 Email Configuration

1. **Update Sender Email**
   - Edit Lambda function
   - Change `noreply@smartcare.example` to your verified SES domain
   - Redeploy Lambda

2. **Add Custom Reply-To**
   - Update SES configuration
   - Set reply-to address: `hello@smartcare.example`

3. **Enable Email Notifications**
   - In Lambda, update `NOTIFICATION_EMAIL`
   - Can add multiple emails (comma-separated)

### 6.3 Monitoring & Alerts

1. **Enable CloudWatch Logs**
   - Lambda automatically logs to CloudWatch
   - View: AWS CloudWatch → Log groups → `/aws/lambda/smartcare-landing-subscribe`

2. **Set Up Alarms**
   - Go to: CloudWatch → Alarms
   - Create alarm for Lambda errors
   - Alert email: Your email

3. **Monitor Email Quota**
   - Go to: SES Console
   - Check daily sending quota
   - Request limit increase if needed

---

## 🔄 Step 7: Continuous Deployment

### 7.1 Auto-Deploy on Git Push

Amplify automatically redeploys when you push to main:

```bash
# Make changes
vim landing/index.html

# Commit and push
git add landing/
git commit -m "Update landing page copy"
git push origin main

# Amplify will automatically redeploy
# Check status: Amplify Console → Deployments
```

### 7.2 Environment-Specific Builds

Create different branches for different environments:

```bash
# Create dev branch
git checkout -b dev
git push origin dev

# In Amplify Console:
# 1. Connect dev branch to dev environment
# 2. Set different environment variables for dev
# 3. Auto-deploy on dev branch pushes
```

---

## 📊 Monitoring & Analytics

### 7.3 Track Email Signups

1. **DynamoDB Queries**
   ```
   View email list in DynamoDB
   Check signup trends by date
   ```

2. **CloudWatch Metrics**
   ```
   Lambda invocations
   Lambda errors
   Lambda duration
   ```

3. **Google Analytics (Optional)**
   - Add GA ID to landing page
   - Track form submissions as events
   - Monitor traffic sources

---

## 🐛 Troubleshooting

### Issue: "Access Denied" when uploading to Lambda

**Solution**:
1. Check IAM role has Lambda permissions
2. Verify SES and DynamoDB permissions added
3. Click "Deploy" after adding permissions

### Issue: Email not received

**Solution**:
1. Check SES is in production mode (not sandbox)
2. Verify sender email is verified in SES
3. Check CloudWatch logs for errors
4. Check spam folder
5. Verify email addresses in environment variables

### Issue: Form shows 403 error

**Solution**:
1. Verify API Gateway endpoint is correct
2. Check CORS is enabled on API Gateway
3. Verify Lambda is integrated with POST method
4. Check CloudWatch logs for Lambda errors

### Issue: DynamoDB not receiving data

**Solution**:
1. Verify DynamoDB table name matches environment variable
2. Check Lambda role has DynamoDB permissions
3. Verify table exists and partition key is "email"
4. Check CloudWatch logs for DynamoDB errors

---

## 💰 Cost Estimate (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| Amplify Hosting | ~50GB | ~$1-5 |
| Lambda | ~1000 invocations | ~$0.20 |
| SES | ~1000 emails | ~$0.10 |
| DynamoDB | ~5GB storage | ~$1-2 |
| API Gateway | ~10K requests | ~$0.35 |
| **Total** | | **~$3-8/month** |

*Free tier may cover first 12 months*

---

## 📋 Final Checklist

Before considering deployment complete:

- [ ] Amplify app deployed successfully
- [ ] Landing page accessible at custom domain
- [ ] Email form works without errors
- [ ] Notification email received at techwithbuchi@gmail.com
- [ ] DynamoDB stores emails
- [ ] Confirmation email sent to subscribers
- [ ] Analytics enabled
- [ ] SSL/HTTPS working
- [ ] Continuous deployment configured
- [ ] Monitoring alerts set up

---

## 🎉 You're Live!

Your SmartCare landing page is now live on Amplify with email backend configured!

**Next Steps**:
1. Share your domain on social media
2. Monitor signup metrics
3. Follow up with early access users
4. Prepare for launch
5. Scale based on demand

---

**For additional help**:
- AWS Amplify Docs: https://docs.amplify.aws/
- API Gateway Docs: https://docs.aws.amazon.com/apigateway/
- SES Docs: https://docs.aws.amazon.com/ses/
- DynamoDB Docs: https://docs.aws.amazon.com/dynamodb/

Happy deploying! 🚀
