
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listStages() {
    const candidates = ['estagios', 'pipeline_estagios', 'crm_estagios', 'kanban_columns', 'stages', 'crm_pipelines', 'funil_etapas', 'crm_funil_etapas'];
    
    for (const table of candidates) {
        const { data, error } = await supabase.from(table).select('*');
        if (!error) {
            console.log(`[FOUND] Table '${table}' exists.`);
            console.log('Data:', JSON.stringify(data, null, 2));
        }
    }
}

listStages();
