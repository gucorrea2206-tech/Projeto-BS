import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://knmcezrygocooyqmspkx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubWNlenJ5Z29jb295cW1zcGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjkyNTUsImV4cCI6MjA4ODgwNTI1NX0.mVEZhuLovMxtZluwcaJjCX2r8DZi93xxHlyGv2_9QcU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTasks() {
  console.log('Testing tasks table...');
  const { data, error } = await supabase.from('tasks').insert({
    title: 'Test Task',
    description: 'Test Description',
    project: 'Geral',
    date: new Date().toISOString().split('T')[0],
    priority: 'medium',
    status: 'todo',
    user: 'Test User'
  }).select();
  
  if (error) {
    console.error('Error inserting task:', error);
  } else {
    console.log('Task inserted successfully:', data);
  }
}

testTasks();
