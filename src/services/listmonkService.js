import { createClient } from '@supabase/supabase-js';

const LISTMONK_URL = process.env.LISTMONK_URL || process.env.VITE_LISTMONK_URL;
const LISTMONK_USERNAME = process.env.LISTMONK_USERNAME || process.env.VITE_LISTMONK_USERNAME;
const LISTMONK_PASSWORD = process.env.LISTMONK_PASSWORD || process.env.VITE_LISTMONK_PASSWORD;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

/**
 * Add a subscriber to Listmonk
 * @param {string} email
 * @param {string} name
 * @returns {Promise<Object>}
 */
export async function addSubscriberToListmonk(email, name) {
  if (!LISTMONK_URL || !LISTMONK_USERNAME || !LISTMONK_PASSWORD) {
    throw new Error('Listmonk config missing');
  }
  const res = await fetch(`${LISTMONK_URL}/api/subscribers`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${LISTMONK_USERNAME}:${LISTMONK_PASSWORD}`).toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      name,
      status: 'enabled'
    })
  });
  if (!res.ok) throw new Error('Failed to add subscriber');
  return await res.json();
}

/**
 * Log a sent email in Supabase
 * @param {Object} params
 * @param {string} params.to_email
 * @param {string} params.subject
 * @param {string} params.template
 * @param {string} params.status
 * @param {string} [params.error]
 */
export async function logSentEmail({ to_email, subject, template, status, error }) {
  if (!supabase) return;
  await supabase.from('sent_emails').insert([
    { to_email, subject, template, status, error }
  ]);
} 