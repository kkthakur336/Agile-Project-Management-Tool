-- =============================================
-- 14_admin_project_insert.sql
-- Restrict project creation (insert) to Admin.
-- =============================================

drop policy if exists "Owners can insert projects" on public.projects;
create policy "Admin can insert projects"
  on public.projects for insert
  with check (
    (auth.jwt() ->> 'email') = 'kkthakur0110@gmail.com'
  );
