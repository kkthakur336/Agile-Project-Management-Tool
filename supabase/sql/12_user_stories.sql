-- =============================================
-- 12_user_stories.sql
-- Creates the user_stories table for projects.
-- =============================================

drop table if exists public.user_stories cascade;

create table if not exists public.user_stories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null default 'Untitled Story',
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_stories enable row level security;

-- Policies

-- Everyone can read user stories
create policy "Anyone can view user stories"
  on public.user_stories for select
  using (true);

-- Any authenticated user can insert user stories
create policy "Anyone can insert user stories"
  on public.user_stories for insert
  to authenticated
  with check (true);

-- Any authenticated user can delete user stories
create policy "Anyone can delete user stories"
  on public.user_stories for delete
  to authenticated
  using (true);

-- Any authenticated user can update user stories
create policy "Anyone can update user stories"
  on public.user_stories for update
  to authenticated
  using (true);
