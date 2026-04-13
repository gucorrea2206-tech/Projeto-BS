import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://knmcezrygocooyqmspkx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubWNlenJ5Z29jb295cW1zcGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjkyNTUsImV4cCI6MjA4ODgwNTI1NX0.mVEZhuLovMxtZluwcaJjCX2r8DZi93xxHlyGv2_9QcU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProjects() {
  console.log('Testing projects table...');
  const { data, error } = await supabase.from('projects').insert({
    name: 'Test Project',
    description: 'Test Description',
    status: 'active',
    progress: 0
  }).select();
  
  if (error) {
    console.error('Error inserting project:', error);
  } else {
    console.log('Project inserted successfully:', data);
  }
}

testProjects();
