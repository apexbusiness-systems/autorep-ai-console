import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sijqccfsvrvgujgkkwuf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpanFjY2ZzdnJ2Z3VqZ2trd3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjcyNjMsImV4cCI6MjA5MDkwMzI2M30.a_AH6_2OjJozUQZfGD9v-JYxBBNAs0falnT68-IyUZk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
