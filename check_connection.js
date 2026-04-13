import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://knmcezrygocooyqmspkx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubWNlenJ5Z29jb295cW1zcGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjkyNTUsImV4cCI6MjA4ODgwNTI1NX0.mVEZhuLovMxtZluwcaJjCX2r8DZi93xxHlyGv2_9QcU'
);

async function check() {
  try {
    const { data, error } = await supabase.from('team_members').select('*').limit(1);
    console.log('Data:', data);
    console.log('Error:', error);
  } catch (e) {
    console.error('Exception:', e);
  }
}

check();
