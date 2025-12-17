
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAvailability() {
    console.log("Testing Availability Edge Function (Method: GET/QueryString)...");
    const payload = {
        doctor_id: "ec8be3b7-2036-4948-9416-9cbf36cf10e6",
        branch_id: "f8012fbf-c8e4-47d2-99db-90c9022f6e61",
        date_from: "2025-12-08T00:00:00-03:00",
        date_to: "2025-12-08T12:00:00-03:00"
    };

    const qs = new URLSearchParams(payload).toString();
    console.log("Query String:", qs);

    try {
        // Try invoking with query params
        // Note: supabase-js invoke might need the query string appended to the function name
        const { data, error } = await supabase.functions.invoke(`availability-api?${qs}`, {
            method: 'GET'
        });

        if (error) {
            console.error("❌ Function returned error:");
            console.error("Status:", error.status);
            console.error("Message:", error.message);
            
            if (error.context && error.context.json) {
                try {
                    const errBody = await error.context.json();
                    console.error("Remote Error Body:", errBody);
                } catch (e) {
                    console.error("Could not parse remote error body.");
                }
            }
        } else {
            console.log("✅ Success! Data received:");
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error("❌ Exception during invocation:", e);
    }
}

testAvailability();
