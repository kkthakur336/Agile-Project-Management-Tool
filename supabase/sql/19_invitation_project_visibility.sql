-- =============================================
-- 19_invitation_project_visibility.sql
-- Allow users who have a pending invitation to 
-- see the name and details of the project they are invited to.
-- =============================================

drop policy if exists "Users can view project if invited" on public.projects;

create policy "Users can view project if invited"
  on public.projects for select
  using (
    exists (
      select 1 from public.invitations
      where project_id = projects.id 
        and email = (auth.jwt() ->> 'email')
    )
  );
