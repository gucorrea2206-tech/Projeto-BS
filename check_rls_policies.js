import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://knmcezrygocooyqmspkx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubWNlenJ5Z29jb295cW1zcGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjkyNTUsImV4cCI6MjA4ODgwNTI1NX0.mVEZhuLovMxtZluwcaJjCX2r8DZi93xxHlyGv2_9QcU'
);

async function check() {
  const { data, error } = await supabase.from('team_members').select('*');
  console.log('Data count:', data?.length);
  
  // Try to insert
  const { data: insertData, error: insertError } = await supabase.from('team_members').insert({
    name: 'Test Member 3',
    email: 'test_member3@example.com',
    role: 'Test',
    permission: 'collaborator',
    avatar: 'user1'
  }).select();
  
  console.log('Insert Error:', insertError);
  
  if (insertData) {
    await supabase.from('team_members').delete().eq('id', insertData[0].id);
  }
}

check();
