-- =============================================
-- 17_accept_invitation_fn.sql
-- RPC function to securely accept an invitation.
-- It updates the invitation status AND the user's role.
-- =============================================

create or replace function public.accept_invitation(target_invite_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  invite_record record;
  current_user_email text;
begin
  -- 1. Get current user's email
  current_user_email := (select email from auth.users where id = auth.uid());
  
  -- 2. Find and verify the invitation
  select * into invite_record 
  from public.invitations 
  where id = target_invite_id 
    and email = current_user_email
    and status = 'Pending';
    
  if not found then
    raise exception 'Invitation not found or already processed.';
  end if;
  
  -- 3. Update invitation status
  update public.invitations 
  set status = 'Accepted' 
  where id = target_invite_id;
  
  -- 4. Update the user's profile role (Global role)
  update public.profiles 
  set role = invite_record.role 
  where id = auth.uid();

  -- 5. If invitation is for a specific project, add them to project_members
  if invite_record.project_id is not null then
    insert into public.project_members (project_id, user_id, role)
    values (invite_record.project_id, auth.uid(), invite_record.role)
    on conflict (project_id, user_id) do update 
    set role = EXCLUDED.role;
  end if;

  -- 6. Create a notification for the inviter that it was accepted
  insert into public.notifications (user_id, type, title, body, related_id, related_type)
  values (
    invite_record.invited_by,
    'invitation_received',
    'Invitation Accepted!',
    current_user_email || ' has joined as ' || invite_record.role,
    target_invite_id,
    'invitation'
  );
end;
$$;

-- Grant access to authenticated users
grant execute on function public.accept_invitation(uuid) to authenticated;
