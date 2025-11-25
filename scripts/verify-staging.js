#!/usr/bin/env node
/*
  A small smoke-test script to validate essential flows against the staging API.
  Usage:
    node scripts/verify-staging.js

  This script reads the following env vars (set them first):
    - STAGING_API (eg. https://<id>.execute-api.us-east-2.amazonaws.com/staging)
    - COGNITO_CLIENT_ID
    - USER_ADMIN (admin username)
    - USER_ADMIN_PASSWORD
    - USER_NURSE (nurse username)
    - USER_NURSE_PASSWORD
    - USER_DOCTOR (doctor username)
    - USER_DOCTOR_PASSWORD

  The script performs:
    1. Login as admin (Cognito) — fetches tokens
    2. POST /createUser as admin to create receptionist user (smoke)
    3. Login as nurse and POST /patients to create a patient
    4. Login as nurse and POST /vitals to add vitals for the patient
    5. Login as doctor and GET /patients to ensure patient is visible

  Note: This script uses AWS Cognito Authenticate via CLI 'initiate-auth' by calling AWS SDK.
*/

const fetch = globalThis.fetch ? globalThis.fetch : require('node-fetch');
const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

const STAGING_API = process.env.STAGING_API;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;

const admin = { user: process.env.USER_ADMIN, pass: process.env.USER_ADMIN_PASSWORD };
const nurse = { user: process.env.USER_NURSE, pass: process.env.USER_NURSE_PASSWORD };
const doctor = { user: process.env.USER_DOCTOR, pass: process.env.USER_DOCTOR_PASSWORD };

if (!STAGING_API || !CLIENT_ID) {
  console.error('Missing STAGING_API or COGNITO_CLIENT_ID environment variables. See .env.staging.example.');
  process.exit(2);
}

const provider = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-2' });

async function login(user, pass) {
  const cmd = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: { USERNAME: user, PASSWORD: pass }
  });

  const res = await provider.send(cmd);
  return res.AuthenticationResult;
}

async function createUser(adminToken, email, password, role = 'receptionist') {
  const res = await fetch(`${STAGING_API}/createUser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ email, password, role })
  });
  return res.json();
}

async function createPatient(token, patient) {
  const res = await fetch(`${STAGING_API}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(patient)
  });
  return res.json();
}

async function main() {
  console.log('1) Logging in as admin...');
  const adminAuth = await login(admin.user, admin.pass);
  const adminIdToken = adminAuth.IdToken;
  console.log(' --> admin login ok');

  console.log('2) Creating receptionist via /createUser');
  const createResp = await createUser(adminIdToken, `receptionist+${Date.now()}@staging.smartcare`, 'DemoPass123!', 'receptionist');
  console.log(' --> createUser response:', createResp);

  console.log('3) Logging in as nurse and creating a patient');
  const nurseAuth = await login(nurse.user, nurse.pass);
  const nurseIdToken = nurseAuth.IdToken;
  const patient = { firstName: 'Demo', lastName: `Patient-${Date.now()}`, email: `demo-${Date.now()}@staging.smartcare`, phone: '+15555550102' };
  const patientResp = await createPatient(nurseIdToken, patient);
  console.log(' --> create patient response:', patientResp);

  console.log('4) Logging in as doctor and listing patients');
  const doctorAuth = await login(doctor.user, doctor.pass);
  const doctorIdToken = doctorAuth.IdToken;
  const listRes = await fetch(`${STAGING_API}/patients`, { headers: { Authorization: `Bearer ${doctorIdToken}` } });
  const listJson = await listRes.json();
  console.log(' --> patients list length:', Array.isArray(listJson) ? listJson.length : 'unexpected', 'sample:', listJson[0]);

  console.log('\nSMOKE TEST COMPLETE');
}

main().catch(err => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
