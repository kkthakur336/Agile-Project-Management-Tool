-- =============================================
-- 06_notifications.sql
-- Notifications table + Supabase Realtime +
-- DB triggers that auto-create notifications
-- on task assignment, status changes, and invitations.
-- Run AFTER 01-05 SQL files.
-- =============================================

-- 1. Notifications table
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  type          text not null,
                -- task_assigned | task_updated | project_created | invitation_received
  title         text not null,
  body          text,
  is_read       boolean default false,
  related_id    uuid,       -- task_id / project_id / invitation_id
  related_type  text,       -- 'task' | 'project' | 'invitation'
  created_at    timestamptz default now()
);

-- Index for fast per-user queries
create index if not exists idx_notifications_user_id on public.notifications(user_id, created_at desc);

-- Row Level Security
alter table public.notifications enable row level security;

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- System (triggers run as security definer) can insert on behalf of any user
drop policy if exists "System can insert notifications" on public.notifications;
create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

-- 2. Enable Realtime for instant delivery (safe — skips if already added)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

-- =============================================
-- TRIGGER: Task assigned → notify assignee
-- =============================================
create or replace function public.notify_on_task_assigned()
returns trigger language plpgsql security definer as $$
begin
  if NEW.assignee_id is not null then
    insert into public.notifications (user_id, type, title, body, related_id, related_type)
    values (
      NEW.assignee_id,
      'task_assigned',
      'New task assigned to you',
      NEW.title,
      NEW.id,
      'task'
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_task_assigned on public.tasks;
create trigger trg_task_assigned
  after insert on public.tasks
  for each row execute procedure public.notify_on_task_assigned();

-- =============================================
-- TRIGGER: Task status changed → notify creator
-- =============================================
create or replace function public.notify_on_task_status_changed()
returns trigger language plpgsql security definer as $$
begin
  if OLD.status is distinct from NEW.status and NEW.created_by is not null then
    -- Don't notify yourself
    if NEW.created_by is distinct from NEW.assignee_id then
      insert into public.notifications (user_id, type, title, body, related_id, related_type)
      values (
        NEW.created_by,
        'task_updated',
        'Task status updated',
        '"' || NEW.title || '" moved to ' || NEW.status,
        NEW.id,
        'task'
      );
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_task_status_changed on public.tasks;
create trigger trg_task_status_changed
  after update on public.tasks
  for each row execute procedure public.notify_on_task_status_changed();

-- =============================================
-- TRIGGER: Invitation created → notify inviter
-- (confirmation) + placeholder for invitee lookup
-- =============================================
create or replace function public.notify_on_invitation()
returns trigger language plpgsql security definer as $$
begin
  if NEW.invited_by is not null then
    insert into public.notifications (user_id, type, title, body, related_id, related_type)
    values (
      NEW.invited_by,
      'invitation_received',
      'Invitation sent',
      'An invite was sent to ' || NEW.email || ' as ' || NEW.role,
      NEW.id,
      'invitation'
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_invitation_created on public.invitations;
create trigger trg_invitation_created
  after insert on public.invitations
  for each row execute procedure public.notify_on_invitation();

-- =============================================
-- TRIGGER: Project created → notify owner
-- =============================================
create or replace function public.notify_on_project_created()
returns trigger language plpgsql security definer as $$
begin
  if NEW.owner_id is not null then
    insert into public.notifications (user_id, type, title, body, related_id, related_type)
    values (
      NEW.owner_id,
      'project_created',
      'Project created',
      '"' || NEW.name || '" is ready to go!',
      NEW.id,
      'project'
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_project_created on public.projects;
create trigger trg_project_created
  after insert on public.projects
  for each row execute procedure public.notify_on_project_created();
