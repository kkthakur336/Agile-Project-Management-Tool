-- =============================================
-- 09_fix_task_rls.sql
-- Broadens the tasks RLS policies so that:
--  • Tasks created without a project_id are visible
--  • Any authenticated user can insert a task
--    (they set themselves as created_by)
--  • Creators and assignees can always see their tasks
-- =============================================

-- SELECT: creator, assignee, or project member can view
drop policy if exists "Project members can view tasks" on public.tasks;
create policy "Users can view their tasks"
  on public.tasks for select
  using (
    auth.uid() = created_by
    or auth.uid() = assignee_id
    or (
      project_id is not null and (
        exists (select 1 from public.project_members where project_id = tasks.project_id and user_id = auth.uid())
        or
        exists (select 1 from public.projects where id = tasks.project_id and owner_id = auth.uid())
      )
    )
  );

-- INSERT: any authenticated user may create a task
--         (project_id may be null for standalone tasks)
drop policy if exists "Project members can insert tasks" on public.tasks;
create policy "Authenticated users can create tasks"
  on public.tasks for insert
  with check (auth.uid() = created_by);

-- UPDATE: creator, assignee, or project owner can update
drop policy if exists "Project members can update tasks" on public.tasks;
create policy "Creators and assignees can update tasks"
  on public.tasks for update
  using (
    auth.uid() = created_by
    or auth.uid() = assignee_id
    or (
      project_id is not null and
      exists (select 1 from public.projects where id = tasks.project_id and owner_id = auth.uid())
    )
  );
