import { api } from './src/services/api.js';
import { supabase } from './src/supabaseClient.js';

async function debugData() {
    try {
        console.log("Fetching Stages...");
        const stages = await api.getStages();
        console.log("Stages:", JSON.stringify(stages, null, 2));

        console.log("\nFetching Expenses...");
        // Fetch all expenses (no farmId filter for now, or pick a farm if needed)
        // We need a user to be logged in for RLS?
        // The api.js methods use supabase client which might not have a session in this node script context unless we sign in.
        // But RLS might allow reading if public? Or we need to sign in.

        // Let's try to sign in first.
        // I don't have credentials.
        // But wait, the user's environment might have a session? No, this is a separate process.

        // If I can't sign in, I can't check RLS protected data.
        // However, I can check the `api.js` logic.

        // Alternative: I can modify `Expenses.jsx` to log the data to the browser console, and ask the user to check it?
        // No, I should try to fix it without asking the user to debug.

        // Let's assume I can't run the script easily because of Auth.
        // I'll check the code logic again.

    } catch (error) {
        console.error("Error:", error);
    }
}

// debugData();
