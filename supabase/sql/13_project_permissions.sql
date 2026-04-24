-- =============================================
-- 13_project_permissions.sql
-- Relax project editing and deletion so any 
-- authenticated user can manage projects.
-- =============================================

drop policy if exists "Owners can update projects" on public.projects;
create policy "Anyone can update projects"
  on public.projects for update
  to authenticated
  using (true);

drop policy if exists "Owners can delete projects" on public.projects;
create policy "Anyone can delete projects"
  on public.projects for delete
  to authenticated
  using (true);
