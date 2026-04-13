import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://knmcezrygocooyqmspkx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubWNlenJ5Z29jb295cW1zcGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjkyNTUsImV4cCI6MjA4ODgwNTI1NX0.mVEZhuLovMxtZluwcaJjCX2r8DZi93xxHlyGv2_9QcU'
);

async function check() {
  // Sign up a dummy user to get an authenticated session
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'dummy_test_user@example.com',
    password: 'password123'
  });
  
  if (authError) {
    console.log('Auth Error:', authError);
    // If user already exists, try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'dummy_test_user@example.com',
      password: 'password123'
    });
    if (signInError) {
      console.log('Sign In Error:', signInError);
      return;
    }
  }

  const { data: insertData, error: insertError } = await supabase.from('team_members').insert({
    name: 'Test Member Auth',
    email: 'test_auth@example.com',
    role: 'Test',
    phone: '',
    permission: 'collaborator',
    avatar: 'user1'
  }).select();
  
  console.log('Insert Error with Auth:', insertError);
  
  if (insertData) {
    await supabase.from('team_members').delete().eq('id', insertData[0].id);
  }
}

check();
