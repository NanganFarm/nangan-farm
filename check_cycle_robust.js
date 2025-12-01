import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env manually
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/["']/g, ''); // Remove quotes
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
// Don't log key

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const cycleId = 'd07352a4-8526-4f34-9632-f9c4efc5be4d';
    console.log(`Checking cycle: ${cycleId}`);

    // 1. Check specific cycle
    const { data: cycle, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('id', cycleId)
        .maybeSingle();

    if (error) console.error('Error fetching cycle:', error);
    else if (cycle) console.log('Cycle found:', cycle);
    else console.log('Cycle NOT found.');

    // 2. List all cycles
    const { data: allCycles } = await supabase.from('cycles').select('id, name, user_id');
    console.log(`Total cycles found: ${allCycles?.length}`);
    if (allCycles) {
        allCycles.forEach(c => console.log(`- ${c.id}: ${c.name} (User: ${c.user_id})`));
    }
}

check();
