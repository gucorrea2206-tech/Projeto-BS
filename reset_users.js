import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://knmcezrygocooyqmspkx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubWNlenJ5Z29jb295cW1zcGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjkyNTUsImV4cCI6MjA4ODgwNTI1NX0.mVEZhuLovMxtZluwcaJjCX2r8DZi93xxHlyGv2_9QcU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Deleting all users from team_members...');
  const { data: allUsers, error: fetchError } = await supabase.from('team_members').select('id');
  if (fetchError) {
    console.error('Error fetching users:', fetchError);
    return;
  }
  
  if (allUsers && allUsers.length > 0) {
    const ids = allUsers.map(u => u.id);
    const { error: deleteError } = await supabase.from('team_members').delete().in('id', ids);
    if (deleteError) {
      console.error('Error deleting users:', deleteError);
      return;
    }
    console.log(`Deleted ${ids.length} users.`);
  } else {
    console.log('No users to delete.');
  }

  console.log('Inserting new admin...');
  const { data: newAdmin, error: insertError } = await supabase.from('team_members').insert([
    {
      name: 'Gustavo Correa',
      email: 'gu.correa98@gmail.com',
      role: 'Administrador',
      permission: 'admin',
      avatar: 'user1'
    }
  ]).select();

  if (insertError) {
    console.error('Error inserting new admin:', insertError);
  } else {
    console.log('Successfully created new admin:', newAdmin);
  }
}
run();
