-- Create sent_emails table if it doesn't exist
create table if not exists public.sent_emails (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text,
  body text,
  sent_at timestamptz default now()
);

-- Expose auth.users as a public view for REST API
create or replace view public.users as
  select id, email, created_at
  from auth.users;

-- Grant API access to the new tables/views
alter publication supabase_realtime add table public.sent_emails;
alter publication supabase_realtime add table public.users;

-- Seed example data
insert into public.sent_emails (to_email, subject, body)
values
  ('test@example.com', 'Welcome!', 'This is a test email.'),
  ('admin@mystorykid.com', 'Order Received', 'Order #1234 has been processed.'); 