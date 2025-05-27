// scripts/setup-listmonk-template.js
// Usage: node scripts/setup-listmonk-template.js

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const LISTMONK_URL = process.env.LISTMONK_URL || process.env.VITE_LISTMONK_URL || 'http://localhost:9000';
const LISTMONK_USERNAME = process.env.LISTMONK_USERNAME || process.env.VITE_LISTMONK_USERNAME;
const LISTMONK_PASSWORD = process.env.LISTMONK_PASSWORD || process.env.VITE_LISTMONK_PASSWORD;

const TEMPLATE_NAME = 'Digital Download Link';
const TEMPLATE_SLUG = 'digital-download-link';
const TEMPLATE_SUBJECT = 'Your Digital Book Download is Ready!';
const TEMPLATE_BODY = `
<html>
  <body>
    <h2>Hi {{ .customer_name }},</h2>
    <p>Thank you for your purchase! Your personalized book <strong>{{ .book_title }}</strong> is ready for download.</p>
    <p>
      <a href="{{ .download_url }}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Download your book</a>
    </p>
    <p>This link will expire on <strong>{{ .expiry_date }}</strong> or after 5 downloads.</p>
    <p>Order ID: {{ .order_id }}</p>
    <hr />
    <p>If you have any issues, reply to this email for support.</p>
  </body>
</html>
`;

async function getTemplates() {
  const res = await fetch(`${LISTMONK_URL}/api/templates`, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${LISTMONK_USERNAME}:${LISTMONK_PASSWORD}`).toString('base64'),
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`Failed to fetch templates: ${res.status}`);
  const data = await res.json();
  return data.data || [];
}

async function createTemplate() {
  const res = await fetch(`${LISTMONK_URL}/api/templates`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${LISTMONK_USERNAME}:${LISTMONK_PASSWORD}`).toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: TEMPLATE_NAME,
      slug: TEMPLATE_SLUG,
      type: 'email',
      subject: TEMPLATE_SUBJECT,
      body: TEMPLATE_BODY,
      is_html: true
    })
  });
  if (!res.ok) throw new Error(`Failed to create template: ${res.status}`);
  const data = await res.json();
  return data.data;
}

async function updateTemplate(id) {
  const res = await fetch(`${LISTMONK_URL}/api/templates/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${LISTMONK_USERNAME}:${LISTMONK_PASSWORD}`).toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: TEMPLATE_NAME,
      slug: TEMPLATE_SLUG,
      type: 'email',
      subject: TEMPLATE_SUBJECT,
      body: TEMPLATE_BODY,
      is_html: true
    })
  });
  if (!res.ok) throw new Error(`Failed to update template: ${res.status}`);
  const data = await res.json();
  return data.data;
}

(async () => {
  try {
    if (!LISTMONK_USERNAME || !LISTMONK_PASSWORD) {
      throw new Error('Listmonk credentials missing. Set LISTMONK_USERNAME and LISTMONK_PASSWORD in your .env file.');
    }
    console.log('Checking for existing Listmonk templates...');
    const templates = await getTemplates();
    const existing = templates.find(t => t.slug === TEMPLATE_SLUG);
    if (!existing) {
      console.log('Template not found. Creating new template...');
      const created = await createTemplate();
      console.log('✅ Template created:', created.name, `(ID: ${created.id})`);
    } else {
      // Check if subject/body match, update if needed
      if (existing.subject !== TEMPLATE_SUBJECT || existing.body !== TEMPLATE_BODY) {
        console.log('Template found but differs from expected. Updating...');
        const updated = await updateTemplate(existing.id);
        console.log('✅ Template updated:', updated.name, `(ID: ${updated.id})`);
      } else {
        console.log('✅ Template already exists and is up to date:', existing.name, `(ID: ${existing.id})`);
      }
    }
    console.log('Done.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})(); 