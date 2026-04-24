import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rsxpesqebelxrbcryssc.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzeHBlc3FlYmVseHJiY3J5c3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTExNzcsImV4cCI6MjA5MjUyNzE3N30.Qavrxcf1XwajKEspRWJbzPUYUUZJBtNxezuPuNVsIb4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
