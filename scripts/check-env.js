/**
 * Checks your .env.local WITHOUT starting the game or printing any secrets.
 *   node scripts/check-env.js
 */
const path = require('path');
const root = path.join(__dirname, '..');
require('@next/env').loadEnvConfig(root);
const { cert } = require('firebase-admin/app');

const ok = (m) => console.log('  OK   ' + m);
const bad = (m) => { console.log('  FAIL ' + m); failed = true; };
let failed = false;

console.log('\nChecking .env.local in ' + root + '\n');

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tinolandia---geopolotics';
const email = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!email) bad('FIREBASE_ADMIN_CLIENT_EMAIL is empty or missing.');
else if (!/@.+\.iam\.gserviceaccount\.com$/.test(email.trim())) bad('FIREBASE_ADMIN_CLIENT_EMAIL does not look like a service-account email (should end with .iam.gserviceaccount.com).');
else {
  ok('client email: ' + email.trim());
  if (!email.includes('@' + projectId + '.')) bad('...but it belongs to a different project than "' + projectId + '". Download the key from the SAME project.');
  else ok('client email matches project "' + projectId + '"');
}

if (!rawKey) bad('FIREBASE_ADMIN_PRIVATE_KEY is empty or missing.');
else {
  const key = rawKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
  const lines = key.trim().split('\n').length;
  console.log('  info private key: ' + key.length + ' characters, ' + lines + ' line(s)');
  if (!key.includes('BEGIN PRIVATE KEY')) bad('Private key does not contain "BEGIN PRIVATE KEY". Copy the whole private_key value from the JSON file.');
  else if (!key.includes('END PRIVATE KEY')) bad('Private key is cut off: it has no "END PRIVATE KEY". It must stay on ONE line inside quotes.');
  else if (lines < 5) bad('Private key has only ' + lines + ' line(s) after decoding; it was probably truncated or pasted wrongly.');
  try {
    cert({ projectId, clientEmail: (email || '').trim(), privateKey: key });
    ok('private key parses correctly');
  } catch (e) {
    bad('private key could not be parsed: ' + e.message);
  }
}

if (process.env.GROQ_API_KEY) ok('GROQ_API_KEY is set (AI commentary on)');
else console.log('  note GROQ_API_KEY is not set: the game works, with built-in commentary instead of AI.');

console.log(failed
  ? '\nFix the FAIL lines above in .env.local, save, restart "npm run dev", and run this again.\n'
  : '\nAll good. Restart "npm run dev" if it was already running, then try START GAME again.\n');
process.exit(failed ? 1 : 0);
