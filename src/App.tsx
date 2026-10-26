import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SubmitPage } from './pages/SubmitPage';
import { ReviewResultsPage } from './pages/ReviewResultsPage';
import { LibraryPage } from './pages/LibraryPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { HistoryPage } from './pages/HistoryPage';
import { InsightsPage } from './pages/InsightsPage';
import { AboutPage } from './pages/AboutPage';

import { Sidebar } from './components/layout/Sidebar';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex bg-[var(--ink-paper)] text-[var(--ink-slate)] selection:bg-[var(--ink-amber)]/20 transition-colors duration-200">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Navbar />
              <main className="flex-1 overflow-x-hidden">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/submit" element={<SubmitPage />} />
                  <Route path="/review/:id" element={<ReviewResultsPage />} />
                  <Route path="/library" element={<LibraryPage />} />
                  <Route path="/approvals/:id" element={<ApprovalsPage />} />
                  <Route path="/history/:id" element={<HistoryPage />} />
                  <Route path="/insights" element={<InsightsPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
