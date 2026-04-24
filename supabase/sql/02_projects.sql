-- =============================================
-- 02_projects.sql
-- Projects that teams work on. Each project
-- belongs to one owner and can have members.
-- =============================================

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  owner_id    uuid references auth.users(id) on delete set null,
  due_date    date,
  status      text default 'Active'
                   check (status in ('Active', 'Completed', 'Archived')),
  color       text default '#5C4FE5',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();

-- Project members (many-to-many)
create table if not exists public.project_members (
  project_id  uuid references public.projects(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  role        text default 'Member'
                   check (role in ('Owner', 'Admin', 'Member', 'Viewer')),
  joined_at   timestamptz default now(),
  primary key (project_id, user_id)
);

-- Row Level Security
alter table public.projects enable row level security;
alter table public.project_members enable row level security;

-- Anyone authenticated can view projects they are a member of
drop policy if exists "Members can view projects" on public.projects;
create policy "Members can view projects"
  on public.projects for select
  using (
    auth.uid() = owner_id or
    exists (
      select 1 from public.project_members
      where project_id = projects.id and user_id = auth.uid()
    )
  );

drop policy if exists "Owners can insert projects" on public.projects;
create policy "Owners can insert projects"
  on public.projects for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can update projects" on public.projects;
create policy "Owners can update projects"
  on public.projects for update
  using (auth.uid() = owner_id);

drop policy if exists "Members can view project_members" on public.project_members;
create policy "Members can view project_members"
  on public.project_members for select
  using (user_id = auth.uid());
