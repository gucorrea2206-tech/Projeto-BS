/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Funnels } from './pages/Funnels';
import { Projects } from './pages/Projects';
import { Activities } from './pages/Activities';
import { Financial } from './pages/Financial';
import { Team } from './pages/Team';
import { AIAssistant } from './pages/AIAssistant';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="funnels" element={<Funnels />} />
            <Route path="projects" element={<Projects />} />
            <Route path="activities" element={<Activities />} />
            <Route path="financial" element={<Financial />} />
            <Route path="team" element={<Team />} />
            <Route path="ai" element={<AIAssistant />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
