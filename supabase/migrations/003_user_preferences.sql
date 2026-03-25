-- ==================================================
-- USER PREFERENCES
-- Stores onboarding data + user-editable settings
-- Used to pre-fill post generation (authorContext)
-- without asking the user every time
-- ==================================================

create table public.user_preferences (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null unique references public.profiles(id) on delete cascade,

  -- Post generation defaults
  writing_style  text     default 'professional',
  language       text     default null, 

  -- Author context (fed into AI prompt automatically)
  role           text,    -- e.g. "Founder", "CEO", "Freelance Designer"
  industry       text,    -- e.g. "SaaS", "Finance", "Marketing"
  audience       text,    -- e.g. "Entrepreneurs", "CTOs", "HR Managers"
  goal           text,    -- e.g. "Build authority", "Generate leads"

  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can read their own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

-- Auto-update updated_at (reuses function from migration 002)
create trigger set_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- Auto-create a preferences row when a new user signs up
create or replace function public.handle_new_user_preferences()
returns trigger as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_preferences
  after insert on public.profiles
  for each row execute function public.handle_new_user_preferences();

-- Index
create index idx_user_preferences_user_id on public.user_preferences(user_id);
