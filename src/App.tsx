import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './pages/Dashboard';
import { ProjectsPage } from './pages/ProjectsPage';
import { CalendarPage } from './pages/CalendarPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { TeamPage } from './pages/TeamPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';
import { InvitationsPage } from './pages/InvitationsPage';
import { supabase } from './lib/supabase';

export default function App() {
  // Initialize page from URL hash or default to dashboard
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'dashboard';
  });
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Sync state with URL hash
  useEffect(() => {
    window.location.hash = page;
  }, [page]);

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== page) {
        setPage(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [page]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen w-full bg-bg flex items-center justify-center">
        <div className="text-brand font-extrabold text-[28px] tracking-tighter animate-pulse" style={{ fontFamily: 'Plus Jakarta Sans' }}>Sprintly</div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage onLogin={() => {}} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg font-sans">
      <Sidebar page={page} setPage={setPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar setPage={setPage} />
        <div className="flex-1 overflow-hidden flex flex-col">
          {page === 'dashboard' && <Dashboard />}
          {page === 'projects' && <ProjectsPage />}
          {page === 'calendar' && <CalendarPage />}
          {page === 'analytics' && <AnalyticsPage />}
          {page === 'team' && <TeamPage />}
          {page === 'settings' && <SettingsPage />}
          {page === 'invitations' && <InvitationsPage />}
        </div>
      </div>
    </div>
  );
}

