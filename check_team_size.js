import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTeamSize() {
  const { data, error } = await supabase
    .from('team_members')
    .select('avatar')
    .eq('email', 'gu.correa98@gmail.com');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Avatar size:', data[0].avatar.length);
  }
}

checkTeamSize();
