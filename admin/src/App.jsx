import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './AuthProvider';
import { supabase } from './supabaseClient';
import Login from './Login';
import EmailLogs from './EmailLogs';
import Analytics from './Analytics';

function AdminDashboard() {
  const { user, loading } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();
      setIsSuperAdmin(!!data?.is_super_admin);
      setProfileLoading(false);
    };
    if (user) fetchProfile();
  }, [user]);

  if (loading || profileLoading) return <div>Loading...</div>;
  if (!user) return <Login />;
  if (!isSuperAdmin) return <div>Access denied. Admins only.</div>;
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 32 }}>
      <h1>MyStoryKid Admin Dashboard</h1>
      <p>Welcome, admin!</p>
      <Analytics />
      <hr style={{ margin: '32px 0' }} />
      <h2>Email Logs</h2>
      <EmailLogs />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AdminDashboard />
    </AuthProvider>
  );
}

export default App; 