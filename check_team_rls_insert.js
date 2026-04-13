import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTeamRLSInsert() {
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      name: 'Test User',
      email: 'test@example.com',
      role: 'Test',
      permission: 'collaborator'
    });

  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Insert Success:', data);
  }
}

checkTeamRLSInsert();
