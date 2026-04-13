import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://knmcezrygocooyqmspkx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubWNlenJ5Z29jb295cW1zcGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjkyNTUsImV4cCI6MjA4ODgwNTI1NX0.mVEZhuLovMxtZluwcaJjCX2r8DZi93xxHlyGv2_9QcU'
);

async function check() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'dummy_test_user@example.com',
    password: 'password123'
  });

  const { data, error } = await supabase
    .from('team_members')
    .insert({
      name: 'Test Member Select',
      email: 'test_select@example.com',
      role: 'Test',
      phone: '',
      permission: 'collaborator',
      avatar: 'user1'
    })
    .select()
    .single();
  
  console.log('Insert Error:', error);
  console.log('Insert Data:', data);
  
  if (data) {
    await supabase.from('team_members').delete().eq('id', data.id);
  }
}

check();
