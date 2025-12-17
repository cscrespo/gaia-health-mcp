
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
    // Hacky way to list tables via PostgREST if we don't have direct SQL access
    // Usually via rpc call if available, or just trying common names.
    // However, Supabase JS client doesn't verify table existence automatically.
    
    // Let's try to query the `information_schema` if we have permissions (unlikely via API usually, but worth a shot if using service role).
    // Actually, simpler: Let's just guess the CRM tables based on standard naming:
    // leads, crm_leads, pipelines, stages, kanban_cards
    
    const candidates = ['leads', 'crm_leads', 'kanban_cards', 'oportunidades', 'funil', 'crm_stages', 'etapas_funil'];
    
    for (const table of candidates) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
            console.log(`[FOUND] Table '${table}' exists.`);
            if(data && data.length > 0) console.log('Sample:', data[0]);
            else console.log('Table is empty.');
        } else {
            console.log(`[MISSING] Table '${table}': ${error.message} (Code: ${error.code})`);
        }
    }
}

listTables();
