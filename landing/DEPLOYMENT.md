# SmartCare Landing Page - Deployment Guide

## 🚀 Deployment Options

Choose the deployment method that best fits your infrastructure:

---

## Option 1: AWS Amplify (Recommended - Matches Existing Setup)

### Why Amplify?
- Already using Amplify for main SmartCare app
- Continuous deployment from Git
- Custom domain support
- HTTPS and CDN included
- Environment variables support

### Step-by-Step Deployment

#### 1. Create Subdirectory Structure
```bash
# The landing page is already in the right structure
c:\Projects\SmartCare-Connect\landing\
├── index.html
├── styles.css
├── script.js
└── README.md
```

#### 2. Create Amplify Configuration (amplify.yml)
Create `landing/amplify.yml`:

```yaml
version: 1
applications:
  - repository: https://github.com/yourusername/SmartCare-Connect
    branch: main
    appRoot: landing
    frontend:
      phases:
        build:
          commands:
            - echo "Landing page is static - no build needed"
      artifacts:
        baseDirectory: .
        files:
          - '**/*'
      cache:
        paths: []
    deploy:
      steps:
        - npx -y @aws-amplify/cli@latest publish --yes
```

#### 3. Configure via AWS Console
```bash
# Using AWS CLI
aws amplify create-app \
    --name smartcare-landing \
    --repository https://github.com/yourusername/SmartCare-Connect \
    --branch main \
    --environment-variables NEXT_PUBLIC_API_URL=https://your-api.com

# Or via AWS Console:
# 1. Go to AWS Amplify
# 2. Click "Create app" → "Host web app"
# 3. Select GitHub repository
# 4. Select branch: main
# 5. Build settings: Keep defaults
# 6. Deploy
```

#### 4. Configure Custom Domain
```bash
# In AWS Amplify Console:
# 1. Select your app
# 2. Go to Domain Management
# 3. Add domain: landing.smartcare.example
# 4. Verify domain ownership
# 5. Update DNS records with Amplify values
```

#### 5. Environment Variables (if needed)
```bash
# In Amplify Console:
# 1. Go to App settings → Environment variables
# 2. Add variables:
#    EMAIL_SERVICE_URL: https://api.smartcare.example/subscribe
#    ANALYTICS_ID: GA_MEASUREMENT_ID

# Update script.js to use if needed
```

#### 6. Deploy
```bash
# Automatic: Just push to main branch
git add .
git commit -m "Deploy landing page"
git push origin main

# Or manual via CLI:
cd landing
amplify publish
```

---

## Option 2: Vercel (Fast & Simple)

### Why Vercel?
- Automatic deployments from Git
- CDN with edge caching
- Serverless functions (if needed later)
- Generous free tier
- 1-click deployment

### Step-by-Step

#### 1. Create `landing/package.json`
```json
{
  "name": "smartcare-landing",
  "version": "1.0.0",
  "private": true,
  "description": "SmartCare landing page",
  "scripts": {
    "dev": "npx serve .",
    "build": "echo 'Static site - no build needed'",
    "start": "npx serve ."
  },
  "devDependencies": {
    "serve": "^14.0.0"
  }
}
```

#### 2. Create `landing/vercel.json`
```json
{
  "buildCommand": "echo 'Static site'",
  "outputDirectory": ".",
  "env": {
    "NEXT_PUBLIC_API_URL": "@smartcare_api_url"
  }
}
```

#### 3. Deploy via Dashboard
```bash
# Option A: Connect Git
1. Go to vercel.com
2. Click "New Project"
3. Import GitHub repository
4. Select root directory: landing
5. Click Deploy

# Option B: CLI
npm i -g vercel
cd landing
vercel --prod
```

#### 4. Custom Domain
```bash
# In Vercel Dashboard:
1. Go to Project Settings → Domains
2. Add domain: landing.smartcare.example
3. Add DNS records to your registrar
4. Wait 24-48 hours for propagation
```

---

## Option 3: Netlify (Easiest for Beginners)

### Why Netlify?
- Drag-and-drop deployment
- Continuous Git integration
- Free HTTPS and CDN
- Form handling built-in
- Great documentation

### Step-by-Step

#### 1. Deploy via Drag-and-Drop
```bash
1. Go to netlify.com
2. Sign in (or create account)
3. Click "Deploy" → Drag folder
4. Drag entire landing/ folder
5. Site deployed instantly!
```

#### 2. Deploy via Git
```bash
1. Create netlify.toml in landing/:

[build]
  command = "echo 'Static site'"
  publish = "."

[context.production]
  command = "echo 'Production build'"

2. Push to GitHub
3. Go to netlify.com → New site from Git
4. Select your GitHub repo
5. Auto-deploys on every commit
```

#### 3. Configure Netlify Forms (Optional)
To use Netlify's form handling instead of backend:

Edit `landing/index.html` form:
```html
<form class="email-form" name="early-access" method="POST" netlify>
    <div class="form-group">
        <input 
            type="email" 
            name="email" 
            placeholder="Enter your email"
            required
        />
        <button type="submit" class="btn btn-primary">
            Get Early Access <span class="arrow">→</span>
        </button>
    </div>
</form>
```

Then in Netlify Dashboard:
1. Go to Forms
2. View submissions when emails come in
3. Set up email notifications if desired

#### 4. Custom Domain
```bash
# In Netlify Dashboard:
1. Go to Domain settings
2. Click "Add custom domain"
3. Update your registrar's DNS
4. Wait for propagation
```

---

## Option 4: GitHub Pages (Free & Simple)

### Why GitHub Pages?
- Completely free
- No configuration needed
- Automatic deployment from main branch
- Great for static sites

### Step-by-Step

#### 1. Enable GitHub Pages
```bash
1. Go to repo Settings
2. Scroll to "GitHub Pages"
3. Select source: main branch
4. Select folder: /landing
5. Site published at: https://yourusername.github.io/SmartCare-Connect/landing
```

#### 2. Custom Domain
```bash
# Create landing/CNAME file:
landing.smartcare.example

# Then in GitHub Settings:
1. Add same domain in "GitHub Pages" settings
2. Update DNS: Create CNAME record pointing to yourusername.github.io
```

---

## Option 5: Traditional Web Hosting (FTP/SFTP)

### Why Traditional Hosting?
- Most control
- Works with any web host
- No learning curve
- Inexpensive

### Step-by-Step

#### 1. Upload via FTP
```bash
# Using FileZilla or similar:
1. Connect to FTP server
2. Navigate to public_html/ folder
3. Create /landing folder
4. Upload:
   - index.html
   - styles.css
   - script.js
5. Site live at: https://yourhost.com/landing
```

#### 2. Update Email Submission Endpoint
In `landing/script.js`:
```javascript
config: {
    emailServiceUrl: 'https://yourhost.com/api/subscribe.php',
}
```

Create `api/subscribe.php` on server:
```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? null;
    
    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        // Save to database or send email
        file_put_contents('emails.txt', $email . "\n", FILE_APPEND);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email']);
    }
}
?>
```

---

## Configuration by Platform

### Environment Variables

#### Amplify
```yaml
# In amplify.yml
env:
  EMAIL_SERVICE: 'https://api.smartcare.example/subscribe'
  ANALYTICS_ID: 'GA_123456'
```

#### Vercel
```json
// vercel.json
{
  "env": {
    "NEXT_PUBLIC_EMAIL_SERVICE": "@email_service_url"
  }
}
```

#### Netlify
```toml
# netlify.toml
[build.environment]
  EMAIL_SERVICE = "https://api.smartcare.example/subscribe"
  ANALYTICS_ID = "GA_123456"
```

---

## Post-Deployment Checklist

After deploying to production, verify:

### Technical
- [ ] Site loads without errors
- [ ] All assets load (CSS, JS)
- [ ] HTTPS connection working
- [ ] Page loads in < 3 seconds
- [ ] Mobile view responsive
- [ ] Forms work correctly

### Content
- [ ] Correct domain name
- [ ] All text displays properly
- [ ] Images/icons render
- [ ] Links work correctly
- [ ] Email captures functioning

### Analytics
- [ ] Google Analytics working (if enabled)
- [ ] Form submissions tracked
- [ ] Event tracking recording
- [ ] Traffic metrics visible

### SEO
- [ ] Sitemap.xml submitted to Google Search Console
- [ ] Meta tags correct (Open Graph, Twitter Card)
- [ ] Robots.txt configured
- [ ] Schema markup added (if needed)

---

## Continuous Deployment Setup

### GitHub Actions Workflow
Create `.github/workflows/deploy-landing.yml`:

```yaml
name: Deploy Landing Page

on:
  push:
    branches: [main]
    paths:
      - 'landing/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Amplify
        uses: aws-actions/amplify-cli-action@v5
        with:
          amplify_cli_version: 12.0.1
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: amplify publish --yes
```

---

## Monitoring & Maintenance

### Set Up Alerts
```bash
# Monitor page performance
1. Enable Amplify/Vercel/Netlify analytics
2. Set up alerts for:
   - Page load time > 5s
   - Error rate > 1%
   - Form submission failures

# Monitor uptime
3. Use external monitoring:
   - UptimeRobot
   - Pingdom
   - StatusCake
```

### Regular Updates
- Weekly: Review form submissions
- Monthly: Analyze traffic and engagement
- Quarterly: Update copy and refresh design
- Yearly: Audit accessibility and performance

---

## Troubleshooting

### Site Not Loading
```bash
# Check DNS propagation
nslookup landing.smartcare.example

# Verify CNAME/A records correct
# Check build logs in deployment platform
# Verify files uploaded completely
```

### Forms Not Submitting
```bash
# Check browser console (F12) for errors
# Verify email service endpoint configured
# Check CORS headers if using external API
# Verify backend server running
```

### Slow Performance
```bash
# Run Lighthouse audit
# Check file sizes
# Enable CDN caching
# Optimize images (if added)
# Check database queries (if applicable)
```

---

## Cost Comparison

| Platform | Cost | Pros | Cons |
|----------|------|------|------|
| **Amplify** | $0.99/mo (storage) | Unified with SmartCare | AWS ecosystem learning curve |
| **Vercel** | Free tier available | Fast, simple, great defaults | Enterprise features costly |
| **Netlify** | Free tier available | Easy forms, great UX | Limits on free tier |
| **GitHub Pages** | Free | Completely free, simple | Limited customization |
| **Traditional** | $5-20/mo | Full control, cheap | Manual management |

---

## Recommended Setup

### For MVP/Validation
**GitHub Pages** - Free, simple, gets landing page live fast

### For Production
**Amplify** - Matches existing stack, unified dashboard, scales well

### For Rapid Iteration
**Netlify** - Form handling built-in, super quick deploys

---

## Next Steps After Deployment

1. **Start tracking metrics**
   - Email signups per day
   - Traffic source breakdown
   - Device/browser analytics

2. **A/B test improvements**
   - Different headlines
   - CTA button text/color
   - Form position/copy

3. **Gather user feedback**
   - Surveys
   - User testing
   - Analytics heatmaps

4. **Connect to backend**
   - Email list management
   - Lead scoring
   - CRM integration

---

**Last Updated**: December 2024
