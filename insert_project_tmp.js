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

async function run() {
  const mockName = 'MOCK_PROJECT_' + Math.random().toString(36).substring(7);
  console.log('Inserting mock project:', mockName);
  const { data, error } = await supabase.from('projects').insert([{
    name: mockName,
    description: 'Mock Description',
    objective: 'Mock Objective',
    category: 'Desarrollo web',
    github_repo: 'https://github.com/mock/mock'
  }]).select('*');

  if (error) {
    console.error('Error inserting project:', error);
  } else {
    console.log('Successfully inserted! Row keys:', Object.keys(data[0]));
    console.log('Row details:', data[0]);
    // Clean up
    const { error: delError } = await supabase.from('projects').delete().eq('name', mockName);
    if (delError) {
      console.error('Error deleting mock project:', delError);
    } else {
      console.log('Successfully deleted mock project.');
    }
  }
}

run();
