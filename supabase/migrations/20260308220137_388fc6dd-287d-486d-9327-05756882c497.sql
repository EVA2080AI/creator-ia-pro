create table if not exists public.demo_usage (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null unique,
  trials_used integer not null default 0,
  last_trial_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now()
);

alter table public.demo_usage enable row level security;