import React from 'react';
import { renderToString } from 'react-dom/server';

// Mock import.meta.env before importing anything else
global.import = { meta: { env: { VITE_SUPABASE_URL: 'https://knmcezrygocooyqmspkx.supabase.co', VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubWNlenJ5Z29jb295cW1zcGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjkyNTUsImV4cCI6MjA4ODgwNTI1NX0.mVEZhuLovMxtZluwcaJjCX2r8DZi93xxHlyGv2_9QcU' } } };

import { Team } from './src/pages/Team';
import { AuthProvider } from './src/contexts/AuthContext';

try {
  const html = renderToString(
    <AuthProvider>
      <Team />
    </AuthProvider>
  );
  console.log('Render successful, length:', html.length);
} catch (e) {
  console.error('Render failed:', e);
}
