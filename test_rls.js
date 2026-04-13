import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://knmcezrygocooyqmspkx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubWNlenJ5Z29jb295cW1zcGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjkyNTUsImV4cCI6MjA4ODgwNTI1NX0.mVEZhuLovMxtZluwcaJjCX2r8DZi93xxHlyGv2_9QcU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Try to insert a row and see if it fails
  const { data, error } = await supabase.from('team_members').select('*').limit(1);
  console.log('Select:', error ? error.message : 'Success');
}
run();
