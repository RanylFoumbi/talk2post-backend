alter table public.posts
  add column status text not null default 'completed'
    check (status in ('draft', 'completed'));

create index idx_posts_status on public.posts(status);
