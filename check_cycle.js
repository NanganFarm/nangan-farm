import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load env vars
const envConfig = dotenv.parse(fs.readFileSync('.env'));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCycle() {
    const cycleId = 'd07352a4-8526-4f34-9632-f9c4efc5be4d';
    console.log(`Checking cycle: ${cycleId}`);

    const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('id', cycleId);

    if (error) {
        console.error('Error fetching cycle:', error);
    } else {
        console.log('Cycle found:', data);
    }
}

checkCycle();
