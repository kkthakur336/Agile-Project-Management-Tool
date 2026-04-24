-- =============================================
-- 21_profile_notification_settings.sql
-- Add persistent notification settings to profiles.
-- =============================================

alter table public.profiles add column if not exists notification_settings jsonb default '{
  "email_notifications": true,
  "task_assignments": true,
  "team_mentions": true,
  "project_updates": false
}'::jsonb;
