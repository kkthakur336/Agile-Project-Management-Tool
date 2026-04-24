-- =============================================
-- 10_admin_task_rls.sql
-- Restricts task mutations to the admin user.
-- Admin: kkthakur0110@gmail.com
--
-- Rules:
--   INSERT  → admin only
--   UPDATE  → admin can update any task;
--             assignee can move In Progress → Review (submit)
--   DELETE  → admin only
--   SELECT  → all authenticated users (unchanged)
-- Run this after 09_fix_task_rls.sql
-- =============================================

-- ── INSERT: admin only ──────────────────────
drop policy if exists "Authenticated users can create tasks" on public.tasks;
drop policy if exists "Project members can insert tasks" on public.tasks;
drop policy if exists "Admin can insert tasks" on public.tasks;

create policy "Admin can insert tasks"
  on public.tasks for insert
  with check (
    (auth.jwt() ->> 'email') = 'kkthakur0110@gmail.com'
  );

-- ── UPDATE: admin full access; assignee submit only ─────────
drop policy if exists "Creators and assignees can update tasks" on public.tasks;
drop policy if exists "Project members can update tasks" on public.tasks;
drop policy if exists "Admin can update any task" on public.tasks;
drop policy if exists "Assignee can submit task for review" on public.tasks;
drop policy if exists "Assignee can update task status" on public.tasks;

create policy "Admin can update any task"
  on public.tasks for update
  using (
    (auth.jwt() ->> 'email') = 'kkthakur0110@gmail.com'
  );

create policy "Assignee can update task status"
  on public.tasks for update
  using (
    auth.uid() = assignee_id
    and status in ('Backlog', 'In Progress')
  )
  with check (
    auth.uid() = assignee_id
    and status in ('In Progress', 'Review')
  );

-- ── DELETE: admin only ──────────────────────
drop policy if exists "Task creators can delete tasks" on public.tasks;
drop policy if exists "Admin can delete tasks" on public.tasks;

create policy "Admin can delete tasks"
  on public.tasks for delete
  using (
    (auth.jwt() ->> 'email') = 'kkthakur0110@gmail.com'
  );
