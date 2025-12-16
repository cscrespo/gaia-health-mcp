
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log("--- DATABASE SCHEMA INSPECTION ---");

    const { data: tables, error } = await supabase
        .from('information_schema.tables') 
        .select('*')
        .eq('table_schema', 'public');

    if (error) {
        console.log("Could not query information_schema via PostgREST.");
        console.log("Reason:", error.message);
        console.log("\nTrying to query common tables to check existence...");
        
        const candidates = [
            'pacientes', 'medicos', 'doutores', 'agendamentos', 'consultas', 
            'usuarios', 'perfis', 'profiles', 'users'
        ];
        const discovery = {};
        
        for (const table of candidates) {
            const check = await supabase.from(table).select('*').limit(1);
            if (!check.error) {
                console.log(`[FOUND] Table '${table}' exists.`);
                discovery[table] = {
                    exists: true,
                    columns: check.data && check.data.length > 0 ? Object.keys(check.data[0]) : ["(Table empty, cannot see columns)"]
                };
            } else {
                console.log(`[MISSING] Table '${table}' - Error: ${check.error.message}`);
                discovery[table] = { exists: false, error: check.error.message };
            }
        }
        
        fs.writeFileSync('schema.json', JSON.stringify(discovery, null, 2));
        console.log("Fallback report saved to schema.json");

    } else {
        console.log("Successfully queried information_schema!");
        fs.writeFileSync('schema.json', JSON.stringify(tables, null, 2));
        console.log("Report saved to schema.json");
    }
}

inspectSchema();
