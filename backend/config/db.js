const { createClient } = require('@supabase/supabase-js');

// 1. Retrieve connection details from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 2. Validate configuration
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('🚨 CRITICAL ERROR: Supabase environment variables are missing.');
    console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.');
    process.exit(1); // Halt server startup if the database cannot be connected
}

// 3. Initialize the Supabase client
// WARNING: Using the Service Role Key bypasses all Row Level Security (RLS) policies.
// This instance has absolute admin privileges over your Supabase project.
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        // Since this is a server-side client, we don't need to manage user sessions
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
});

// 4. Export the initialized client for use across controllers
module.exports = supabaseAdmin;