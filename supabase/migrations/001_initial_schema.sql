-- Talk2Post: Supabase SQL Migration
-- Run this in Supabase Dashboard → SQL Editor

-- ==================================================
-- 1. PROFILES (extends auth.users)
-- ==================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'user' check (role in ('admin', 'user')),
  writing_style text,
  post_type_preference text default 'inspiring',
  credits_remaining int default 5,
  plan text default 'free',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==================================================
-- 2. RECORDINGS (voice notes)
-- ==================================================
create table public.recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  audio_url text,
  duration int,
  transcript text,
  language text default 'en',
  status text default 'processing',
  created_at timestamptz default now()
);

alter table public.recordings enable row level security;

create policy "Users can read their own recordings"
  on public.recordings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own recordings"
  on public.recordings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own recordings"
  on public.recordings for update
  using (auth.uid() = user_id);

-- ==================================================
-- 3. POSTS (AI-generated LinkedIn posts)
-- ==================================================
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recording_id uuid references public.recordings(id) on delete set null,
  content text not null,
  post_type text default 'inspiring',
  is_favorite boolean default false,
  copied_at timestamptz,
  created_at timestamptz default now()
);

alter table public.posts enable row level security;

create policy "Users can read their own posts"
  on public.posts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = user_id);

-- ==================================================
-- 4. SUBSCRIPTIONS (LemonSqueezy payments)
-- ==================================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lemonsqueezy_id text,
  status text default 'active',
  current_period_end timestamptz,
  created_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can read their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ==================================================
-- INDEXES (for performance)
-- ==================================================
create index idx_recordings_user_id on public.recordings(user_id);
create index idx_recordings_status on public.recordings(status);

create index idx_posts_user_id on public.posts(user_id);
create index idx_posts_recording_id on public.posts(recording_id);

create index idx_subscriptions_user_id on public.subscriptions(user_id);
