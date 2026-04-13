import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('team_members').insert({
    name: 'Test Member',
    email: 'test@example.com',
    role: 'Test Role',
    permission: 'collaborator'
  }).select();
  console.log('team_members insert:', error ? error.message : 'Success');
  
  const { data: pData, error: pError } = await supabase.from('projects').insert({
    name: 'Test Project',
    description: 'Test Description',
    status: 'active'
  }).select();
  console.log('projects insert:', pError ? pError.message : 'Success');
  
  const { data: tData, error: tError } = await supabase.from('tasks').insert({
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium'
  }).select();
  console.log('tasks insert:', tError ? tError.message : 'Success');
}
check();
