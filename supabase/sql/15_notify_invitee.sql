-- =============================================
-- 15_notify_invitee.sql
-- Update the invitation trigger to notify the 
-- person being invited if they already have an account.
-- =============================================

create or replace function public.notify_on_invitation()
returns trigger language plpgsql security definer as $$
declare
  invitee_id uuid;
  inviter_name text;
begin
  -- Get inviter name for better notification body
  select full_name into inviter_name from public.profiles where id = NEW.invited_by;
  if inviter_name is null then inviter_name := 'Someone'; end if;

  -- 1. Notify the inviter (Confirmation)
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

  -- 2. Notify the invitee (if they already have an account)
  -- Note: This requires the trigger to be security definer to read auth.users
  select id into invitee_id from auth.users where email = NEW.email;
  
  if invitee_id is not null then
    insert into public.notifications (user_id, type, title, body, related_id, related_type)
    values (
      invitee_id,
      'invitation_received',
      'New Project Invitation',
      inviter_name || ' has invited you to join a project as a ' || NEW.role,
      NEW.id,
      'invitation'
    );
  end if;

  return NEW;
end;
$$;
