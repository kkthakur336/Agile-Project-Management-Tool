-- =============================================
-- 08_messages.sql
-- Direct messages between team members.
-- =============================================

create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid references auth.users(id) on delete cascade not null,
  recipient_id uuid references auth.users(id) on delete cascade not null,
  subject      text,
  body         text not null,
  is_read      boolean default false,
  created_at   timestamptz default now()
);

create index if not exists idx_messages_recipient on public.messages(recipient_id, created_at desc);
create index if not exists idx_messages_sender    on public.messages(sender_id, created_at desc);

alter table public.messages enable row level security;

-- Users can see messages they sent or received
drop policy if exists "Users can view their messages" on public.messages;
create policy "Users can view their messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Authenticated users can send messages" on public.messages;
create policy "Authenticated users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

drop policy if exists "Recipients can mark messages read" on public.messages;
create policy "Recipients can mark messages read"
  on public.messages for update
  using (auth.uid() = recipient_id);

-- Enable Realtime (safe — skips if already added)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

-- Notify recipient when a new message arrives
create or replace function public.notify_on_message()
returns trigger language plpgsql security definer as $$
declare sender_name text;
begin
  -- fetch sender name (may stay NULL if profile row doesn't exist)
  select full_name into sender_name
  from public.profiles where id = NEW.sender_id;

  insert into public.notifications (user_id, type, title, body, related_id, related_type)
  values (
    NEW.recipient_id,
    'message_received',
    -- coalesce here so NULL || anything never reaches the NOT NULL column
    'New message from ' || coalesce(sender_name, 'A team member'),
    coalesce(NEW.subject, NEW.body),
    NEW.id,
    'message'
  );
  return NEW;
end;
$$;

drop trigger if exists trg_message_received on public.messages;
create trigger trg_message_received
  after insert on public.messages
  for each row execute procedure public.notify_on_message();
