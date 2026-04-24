-- =============================================
-- 20_revoke_invitation_fn.sql
-- RPC function to securely revoke an invitation.
-- If the user already joined, it removes them from project_members.
-- =============================================

create or replace function public.revoke_invitation(target_invite_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  invite_record record;
  invitee_id uuid;
begin
  -- 1. Get the invitation
  select * into invite_record from public.invitations where id = target_invite_id;
  if not found then
    raise exception 'Invitation not found.';
  end if;

  -- 2. Check if the current user is the inviter or admin
  if auth.uid() != invite_record.invited_by and (select email from auth.users where id = auth.uid()) != 'kkthakur0110@gmail.com' then
    raise exception 'Not authorized to revoke this invitation.';
  end if;

  -- 3. If accepted, find the user and remove them from project members
  if invite_record.status = 'Accepted' then
    -- Find the user ID from auth.users via email
    select id into invitee_id from auth.users where email = invite_record.email;
    
    if invitee_id is not null and invite_record.project_id is not null then
      delete from public.project_members 
      where project_id = invite_record.project_id 
        and user_id = invitee_id;
        
      -- Also create a notification for the member
      insert into public.notifications (user_id, type, title, body, related_id, related_type)
      values (
        invitee_id,
        'invitation_received',
        'Access Revoked',
        'Your access to the project has been revoked by the administrator.',
        target_invite_id,
        'invitation'
      );
    end if;
  end if;

  -- 4. Delete the invitation (or mark as revoked, but deleting is cleaner for re-inviting)
  delete from public.invitations where id = target_invite_id;
end;
$$;

grant execute on function public.revoke_invitation(uuid) to authenticated;
