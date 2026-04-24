-- =============================================
-- 04_calendar_events.sql
-- Calendar events / milestones linked to projects.
-- =============================================

create table if not exists public.calendar_events (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects(id) on delete cascade,
  title       text not null,
  description text,
  start_time  timestamptz not null,
  end_time    timestamptz,
  created_by  uuid references auth.users(id) on delete set null,
  color       text default '#5C4FE5',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

drop trigger if exists set_events_updated_at on public.calendar_events;
create trigger set_events_updated_at
  before update on public.calendar_events
  for each row execute procedure public.set_updated_at();

-- Row Level Security
alter table public.calendar_events enable row level security;

drop policy if exists "Project members can view events" on public.calendar_events;
create policy "Project members can view events"
  on public.calendar_events for select
  using (
    exists (
      select 1 from public.project_members
      where project_id = calendar_events.project_id and user_id = auth.uid()
    ) or
    exists (
      select 1 from public.projects
      where id = calendar_events.project_id and owner_id = auth.uid()
    )
  );

drop policy if exists "Project members can insert events" on public.calendar_events;
create policy "Project members can insert events"
  on public.calendar_events for insert
  with check (auth.uid() = created_by);

drop policy if exists "Creators can update events" on public.calendar_events;
create policy "Creators can update events"
  on public.calendar_events for update
  using (auth.uid() = created_by);

drop policy if exists "Creators can delete events" on public.calendar_events;
create policy "Creators can delete events"
  on public.calendar_events for delete
  using (auth.uid() = created_by);
