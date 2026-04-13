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
import { Settings } from './pages/Settings';
import { Accesses } from './pages/Accesses';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import { ShieldAlert, LogOut, Clock } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isActive, signOut } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="glass-card max-w-md w-full p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto">
            <Clock size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-heading font-bold text-white">Aguardando Aprovação</h1>
            <p className="text-text-secondary">
              Sua conta foi criada com sucesso, mas ainda precisa ser autorizada por um administrador para acessar o sistema.
            </p>
          </div>
          <div className="pt-4">
            <button 
              onClick={signOut}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg border border-border text-white hover:bg-white/5 transition-colors font-medium"
            >
              <LogOut size={18} />
              Sair da Conta
            </button>
          </div>
          <p className="text-xs text-text-secondary italic">
            Dica: Entre em contato com gu.correa98@gmail.com para agilizar sua aprovação.
          </p>
        </div>
      </div>
    );
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
            <Route path="accesses" element={<Accesses />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
