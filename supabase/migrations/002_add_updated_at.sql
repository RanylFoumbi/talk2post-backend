-- ==================================================
-- Add updated_at to all tables + auto-update trigger
-- ==================================================

-- Trigger function (shared by all tables)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ==================================================
-- profiles
-- ==================================================
alter table public.profiles
  add column updated_at timestamptz default now();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ==================================================
-- recordings
-- ==================================================
alter table public.recordings
  add column updated_at timestamptz default now();

create trigger set_recordings_updated_at
  before update on public.recordings
  for each row execute function public.set_updated_at();

-- ==================================================
-- posts
-- ==================================================
alter table public.posts
  add column updated_at timestamptz default now();

create trigger set_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ==================================================
-- subscriptions
-- ==================================================
alter table public.subscriptions
  add column updated_at timestamptz default now();

create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
