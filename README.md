This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.

## SmartCare Connect - Healthcare Management System

A comprehensive healthcare management platform with offline-first capabilities, role-based access control, and enterprise-grade security.

## CI / Staging

This repository includes a workflow to package Lambda artifacts and run a Terraform plan for the staging environment.

- Manual local packaging: `npm run build:lambdas:staging` (creates zip files under `terraform/envs/staging`)
- To run a local Terraform plan for staging:

```bash
cd terraform/envs/staging
terraform init
terraform plan
```

See `.github/workflows/deploy-lambdas-staging.yml` for the CI workflow - configure AWS credentials as GitHub Secrets to enable the plan/apply steps.

## Running the frontend against Staging (quick demo)

1) Copy `.env.staging.example` to your local `.env.local` at the project root and edit values if needed.

```bash
cp .env.staging.example .env.local
# Edit .env.local to match outputs from Terraform (see terraform/envs/staging/staging-outputs.json)
```

2) Start the Next.js app locally:

```bash
npm ci
npm run dev
```

3) Login with a staging user to exercise flows (example credentials created during staging):

- admin@staging.smartcare / DemoPass123!  (admin - can create users)
- nurse@staging.smartcare / DemoPass123!  (nurse - create patients, vitals, triage)
- doctor@staging.smartcare / DemoPass123! (doctor - fetch patient, review vitals/triage)

4) Run a small smoke test from the repo (optional):

Set env vars then run:

```powershell
$env:STAGING_API='https://<api-id>.execute-api.us-east-2.amazonaws.com/staging'
$env:COGNITO_CLIENT_ID='<cognito-client-id>'
$env:USER_ADMIN='admin@staging.smartcare'
$env:USER_ADMIN_PASSWORD='DemoPass123!'
$env:USER_NURSE='nurse@staging.smartcare'
$env:USER_NURSE_PASSWORD='DemoPass123!'
$env:USER_DOCTOR='doctor@staging.smartcare'
$env:USER_DOCTOR_PASSWORD='DemoPass123!'
node scripts/verify-staging.js
```

Notes:
- If you use the app with `NEXT_PUBLIC_USE_AWS=true` the frontend will authenticate to Cognito; the Admin UI will read Cognito idTokens stored in localStorage and use them to call `/createUser` (the admin UI supports both Firebase and Cognito flows).
- For a quick presentation, you can run the app locally and follow: Admin → Create user → Nurse → Create patient → Record vitals / create triage → Doctor → View patient.

## Amplify: Deploying the latest changes

If your GitHub repo is connected to AWS Amplify hosting, there are two ways to redeploy the latest commit or trigger a build:

1) Push changes to the branch connected to Amplify (e.g., `main`) — Amplify will auto-build.

2) Use the GitHub Action `amplify-redeploy.yml` (manual dispatch or push to `main`) to start a release job via the AWS CLI.

Required repository secrets (set on GitHub):
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION (optional; default us-east-2)
- AMPLIFY_APP_ID (your Amplify app id)

To set Amplify environment variables (without committing secrets) and then release a build:

1. Create a JSON file (locally) `env-vars.json` containing key -> value object with build-time environment variables, e.g.

```json
{
	"NEXT_PUBLIC_USE_AWS": "true",
	"NEXT_PUBLIC_API_GATEWAY_URL": "https://5jlr7hmqv5.execute-api.us-east-2.amazonaws.com/staging",
	"NEXT_PUBLIC_COGNITO_CLIENT_ID": "2e5sdfoptopi4kpu6qun90hcos",
	"NEXT_PUBLIC_COGNITO_USER_POOL_ID": "us-east-2_PmWQ4Iyma"
}
```

2. Run the helper script (needs aws cli + jq installed):

```bash
APP_ID=<your-amplify-app-id> ENV_FILE=env-vars.json ./scripts/amplify-set-env.sh
```

3. Trigger a release via the GitHub Action (manual dispatch) or via the AWS CLI:

```bash
aws amplify start-job --app-id <your-id> --branch-name main --job-type RELEASE
```

Important: Never commit credentials or passwords directly to the repo. Use repository secrets or AWS Secrets Manager and Amplify environment variables for build-time values.
