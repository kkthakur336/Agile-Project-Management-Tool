-- =============================================
-- 16_invitations_rls_fix.sql
-- Ensure admins can see all invitations and
-- users can see invitations sent to them.
-- =============================================

-- 1. Clear old policies
drop policy if exists "Users can view their own invitations" on public.invitations;
drop policy if exists "Admins can view all invitations" on public.invitations;

-- 2. Allow the inviter to see the invites they sent
create policy "Inviters can view their own invites"
  on public.invitations for select
  using (auth.uid() = invited_by);

-- 3. Allow the admin to see everything
create policy "Admins can view all invitations"
  on public.invitations for select
  using ((auth.jwt() ->> 'email') = 'kkthakur0110@gmail.com');

-- 4. Allow the invitee to see invites sent to their email
create policy "Invitees can view invitations sent to them"
  on public.invitations for select
  using (email = (auth.jwt() ->> 'email'));

-- 5. Ensure anyone can update their own invitations (accept/decline)
drop policy if exists "Invitees can update their invitations" on public.invitations;
create policy "Invitees can update their invitations"
  on public.invitations for update
  using (email = (auth.jwt() ->> 'email'));
