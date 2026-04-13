import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

// Mock import.meta.env
globalThis.import = { meta: { env: { VITE_SUPABASE_URL: 'https://knmcezrygocooyqmspkx.supabase.co', VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubWNlenJ5Z29jb295cW1zcGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjkyNTUsImV4cCI6MjA4ODgwNTI1NX0.mVEZhuLovMxtZluwcaJjCX2r8DZi93xxHlyGv2_9QcU' } } };

async function run() {
  const { Team } = await import('./src/pages/Team.tsx');
  const { AuthProvider } = await import('./src/contexts/AuthContext.tsx');

  try {
    const html = renderToString(
      <MemoryRouter>
        <AuthProvider>
          <Team />
        </AuthProvider>
      </MemoryRouter>
    );
    console.log('Render successful, length:', html.length);
  } catch (e) {
    console.error('Render failed:', e);
  }
}
run();
