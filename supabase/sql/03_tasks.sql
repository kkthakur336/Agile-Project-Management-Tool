-- =============================================
-- 03_tasks.sql
-- Tasks belong to a project and can be assigned
-- to a team member. Tracks status and priority.
-- =============================================

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects(id) on delete cascade,
  title       text not null,
  description text,
  assignee_id uuid references auth.users(id) on delete set null,
  created_by  uuid references auth.users(id) on delete set null,
  status      text default 'Backlog'
                   check (status in ('Backlog', 'In Progress', 'Review', 'Done')),
  priority    text default 'Med'
                   check (priority in ('High', 'Med', 'Low')),
  points      int default 1,
  due_date    date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.set_updated_at();

-- Row Level Security
alter table public.tasks enable row level security;

-- Users can view tasks in projects they belong to
drop policy if exists "Project members can view tasks" on public.tasks;
create policy "Project members can view tasks"
  on public.tasks for select
  using (
    exists (
      select 1 from public.project_members
      where project_id = tasks.project_id and user_id = auth.uid()
    ) or
    exists (
      select 1 from public.projects
      where id = tasks.project_id and owner_id = auth.uid()
    )
  );

drop policy if exists "Project members can insert tasks" on public.tasks;
create policy "Project members can insert tasks"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.project_members
      where project_id = tasks.project_id and user_id = auth.uid()
    ) or
    exists (
      select 1 from public.projects
      where id = tasks.project_id and owner_id = auth.uid()
    )
  );

drop policy if exists "Project members can update tasks" on public.tasks;
create policy "Project members can update tasks"
  on public.tasks for update
  using (
    auth.uid() = assignee_id or
    auth.uid() = created_by or
    exists (
      select 1 from public.projects
      where id = tasks.project_id and owner_id = auth.uid()
    )
  );

drop policy if exists "Task creators can delete tasks" on public.tasks;
create policy "Task creators can delete tasks"
  on public.tasks for delete
  using (auth.uid() = created_by);
