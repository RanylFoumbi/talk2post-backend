-- ==================================================
-- Clean up duplication between profiles and user_preferences
-- profiles.writing_style        → user_preferences.writing_style
-- profiles.post_type_preference → posts.post_type (already there, just drop)
-- ==================================================

-- 1. Migrate writing_style from profiles → user_preferences before dropping
update public.user_preferences up
set writing_style = coalesce(p.writing_style, up.writing_style)
from public.profiles p
where up.user_id = p.id;

-- 2. Drop duplicated columns from profiles
--    post_type_preference is dropped here because post_type already lives on posts
alter table public.profiles
  drop column writing_style,
  drop column post_type_preference;
