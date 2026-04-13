import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://knmcezrygocooyqmspkx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubWNlenJ5Z29jb295cW1zcGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjkyNTUsImV4cCI6MjA4ODgwNTI1NX0.mVEZhuLovMxtZluwcaJjCX2r8DZi93xxHlyGv2_9QcU'
);

async function check() {
  // Login as the user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'gu.correa2206@gmail.com',
    password: 'password123' // I don't know the password, so I can't easily test authenticated role this way.
  });
}
