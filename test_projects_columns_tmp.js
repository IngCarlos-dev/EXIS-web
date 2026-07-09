import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);

async function testColumn(columnName) {
  const { data, error } = await supabase.from('projects').select(columnName).limit(1);
  if (error) {
    // console.log(`Column '${columnName}' does NOT exist`);
    return false;
  } else {
    console.log(`Column '${columnName}' EXISTS in projects!`);
    return true;
  }
}

async function run() {
  const candidates = [
    'verification_code',
    'security_hash',
    'unique_code',
    'code',
    'hash',
    'token',
    'key'
  ];
  for (const c of candidates) {
    await testColumn(c);
  }
  console.log('Test finished.');
}

run();
