-- =============================================
-- 11_set_admin_role.sql
-- Sets the admin user's profile role to 'Admin'.
-- Run once after 10_admin_task_rls.sql.
-- =============================================

update public.profiles
set role = 'Admin'
where id = (
  select id from auth.users
  where email = 'kkthakur0110@gmail.com'
  limit 1
);
