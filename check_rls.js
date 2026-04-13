import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('team_members').select('*');
  console.log('team_members select:', error ? error.message : data.length + ' rows');
  
  const { data: pData, error: pError } = await supabase.from('projects').select('*');
  console.log('projects select:', pError ? pError.message : pData.length + ' rows');
  
  const { data: tData, error: tError } = await supabase.from('tasks').select('*');
  console.log('tasks select:', tError ? tError.message : tData.length + ' rows');
}
check();
