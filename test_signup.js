import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  const { data, error } = await supabase.auth.signUp({
    email: 'gu.correa98@gmail.com',
    password: 'somepassword'
  });
  console.log('Signup result:', { data, error: error?.message });
}

testSignup();
