-- =============================================
-- 07_event_notifications.sql
-- DB trigger: fires a notification whenever
-- a calendar event is created.
-- Also adds 'event_created' type support.
-- =============================================

create or replace function public.notify_on_event_created()
returns trigger language plpgsql security definer as $$
begin
  if NEW.created_by is not null then
    insert into public.notifications (user_id, type, title, body, related_id, related_type)
    values (
      NEW.created_by,
      'event_created',
      'Calendar event scheduled',
      '"' || NEW.title || '" on ' || to_char(NEW.start_time AT TIME ZONE 'UTC', 'Mon DD, YYYY'),
      NEW.id,
      'calendar_event'
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_event_created on public.calendar_events;
create trigger trg_event_created
  after insert on public.calendar_events
  for each row execute procedure public.notify_on_event_created();
