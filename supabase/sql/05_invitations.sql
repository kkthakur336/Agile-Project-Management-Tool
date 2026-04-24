-- =============================================
-- 05_invitations.sql
-- Stores pending invitations sent to emails.
-- Also widens the profiles read policy so
-- authenticated users can view all team members.
-- =============================================

-- Allow all authenticated users to see all profiles
-- (needed for member dropdowns in AddTaskModal etc.)
drop policy if exists "Authenticated users can view all profiles" on public.profiles;
create policy "Authenticated users can view all profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Invitations table
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  role        text default 'Member'
                   check (role in ('Admin', 'Member', 'Viewer')),
  invited_by  uuid references auth.users(id) on delete set null,
  status      text default 'Pending'
                   check (status in ('Pending', 'Accepted', 'Declined')),
  project_id  uuid references public.projects(id) on delete cascade,
  created_at  timestamptz default now()
);

alter table public.invitations enable row level security;

drop policy if exists "Users can view their own invitations" on public.invitations;
create policy "Users can view their own invitations"
  on public.invitations for select
  using (auth.uid() = invited_by);

drop policy if exists "Authenticated users can insert invitations" on public.invitations;
create policy "Authenticated users can insert invitations"
  on public.invitations for insert
  with check (auth.uid() = invited_by);

drop policy if exists "Inviters can update invitations" on public.invitations;
create policy "Inviters can update invitations"
  on public.invitations for update
  using (auth.uid() = invited_by);
