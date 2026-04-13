import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://knmcezrygocooyqmspkx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubWNlenJ5Z29jb295cW1zcGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjkyNTUsImV4cCI6MjA4ODgwNTI1NX0.mVEZhuLovMxtZluwcaJjCX2r8DZi93xxHlyGv2_9QcU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTeam2() {
  console.log('Testing team_members table...');
  const newMemberData = {
    name: 'Test Member 2',
    role: 'Test Role',
    email: 'test2@example.com',
    phone: '123456789',
    permission: 'collaborator',
    avatar: 'user12'
  };

  const { data, error } = await supabase
    .from('team_members')
    .insert(newMemberData)
    .select()
    .single();
  
  if (error) {
    console.error('Error inserting team_members:', error);
  } else {
    console.log('Team member inserted successfully:', data);
  }
}

testTeam2();
