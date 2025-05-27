import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function EmailLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('sent_emails')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);
      if (error) setError(error.message);
      else setLogs(data || []);
      setLoading(false);
    }
    fetchLogs();
  }, []);

  if (loading) return <p>Loading email logs...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!logs.length) return <p>No email logs found.</p>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={th}>Sent At</th>
            <th style={th}>To</th>
            <th style={th}>Subject</th>
            <th style={th}>Template</th>
            <th style={th}>Status</th>
            <th style={th}>Error</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} style={{ background: log.status === 'error' ? '#ffeaea' : undefined }}>
              <td style={td}>{new Date(log.sent_at).toLocaleString()}</td>
              <td style={td}>{log.to_email}</td>
              <td style={td}>{log.subject}</td>
              <td style={td}>{log.template}</td>
              <td style={td}>{log.status}</td>
              <td style={td}>{log.error}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = { border: '1px solid #ddd', padding: 8, background: '#f5f5f5', fontWeight: 'bold' };
const td = { border: '1px solid #ddd', padding: 8 }; 