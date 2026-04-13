import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://knmcezrygocooyqmspkx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubWNlenJ5Z29jb295cW1zcGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjkyNTUsImV4cCI6MjA4ODgwNTI1NX0.mVEZhuLovMxtZluwcaJjCX2r8DZi93xxHlyGv2_9QcU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDelete() {
  const { data: insertData, error: insertError } = await supabase
    .from('team_members')
    .insert({
      name: 'To Be Deleted',
      role: 'Test',
      email: 'delete@test.com',
      permission: 'collaborator'
    })
    .select()
    .single();

  if (insertError) {
    console.error('Insert error:', insertError);
    return;
  }

  console.log('Inserted:', insertData);

  const { error: deleteError } = await supabase
    .from('team_members')
    .delete()
    .eq('id', insertData.id);

  if (deleteError) {
    console.error('Delete error:', deleteError);
  } else {
    console.log('Deleted successfully');
  }
}

testDelete();
