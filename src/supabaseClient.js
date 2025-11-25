import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vrmvjwhobmytnebygfgr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybXZqd2hvYm15dG5lYnlnZmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNjQwMDQsImV4cCI6MjA3OTY0MDAwNH0.iwfSZ7T8Nk0qS1PEBR0W6wodjnzQzm1Y7SvdMgTnC-k';

export const supabase = createClient(supabaseUrl, supabaseKey);
