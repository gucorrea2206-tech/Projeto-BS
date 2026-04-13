import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://knmcezrygocooyqmspkx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubWNlenJ5Z29jb295cW1zcGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjkyNTUsImV4cCI6MjA4ODgwNTI1NX0.mVEZhuLovMxtZluwcaJjCX2r8DZi93xxHlyGv2_9QcU'
);

async function check() {
  const { data, error } = await supabase.rpc('get_policies');
  console.log('Policies:', data);
  console.log('Error:', error);
}

check();
