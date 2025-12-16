
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectTables() {
    // Note: accessing information_schema might require direct SQL or specific permissions depending on Supabase setup.
    // Standard Query:
    // This often fails via 'from' if not exposed. Let's try RPC or look at known tables if this fails.
    // Actually, 'information_schema' is usually not exposed to the API. 
    // A better way often is to check what we can see or just list definitions I know.
    
    // BUT, let's try a different approach:
    // If I can't query schema directly, I'll try to guess 'organizacoes' or 'configuracoes'.
    
    // Attempt 1: Query 'organizacoes' directly.
    const { data: orgs, error: orgError } = await supabase.from('organizacoes').select('*').limit(1);
    console.log("Table 'organizacoes':", orgError ? "Error/Missing" : "Exists");
    if (orgs) console.log("Sample:", orgs);

    const { data: configs, error: confError } = await supabase.from('configuracoes_financeiras').select('*').limit(1);
    console.log("Table 'configuracoes_financeiras':", confError ? "Error/Missing" : "Exists");
}

inspectTables();
