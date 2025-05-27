import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const [{ count: userCount }, { count: orderCount }, { count: downloadCount }, { count: emailCount }] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('digital_downloads').select('*', { count: 'exact', head: true }),
          supabase.from('sent_emails').select('*', { count: 'exact', head: true })
        ]);
        setStats({ userCount, orderCount, downloadCount, emailCount });
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return <p>Loading analytics...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!stats) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <h2>App Analytics</h2>
      <ul style={{ listStyle: 'none', padding: 0, fontSize: 18 }}>
        <li><strong>Users:</strong> {stats.userCount}</li>
        <li><strong>Orders:</strong> {stats.orderCount}</li>
        <li><strong>Digital Downloads:</strong> {stats.downloadCount}</li>
        <li><strong>Emails Sent:</strong> {stats.emailCount}</li>
      </ul>
    </div>
  );
} 