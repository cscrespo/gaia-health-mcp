
import { listAppointments } from './dist/tools/appointments.js';
import dotenv from 'dotenv'; // Load it here too just in case
dotenv.config();

async function runTest() {
    console.log("--- DIAGNOSTICS ---");
    console.log("CWD:", process.cwd());
    console.log("Has SUPABASE_URL:", !!process.env.SUPABASE_URL);
    console.log("Has SUPABASE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log("-------------------");

    console.log("Starting Read-Only Database Test...");
    try {
        const appointments = await listAppointments({});
        console.log("SUCCESS: Connected to Supabase!");
        console.log(`Count: ${appointments.length}`);
    } catch (err) {
        console.log("ERROR_TYPE:", err.name);
        console.log("ERROR_MSG:", err.message);
        // console.log("FULL_ERR:", JSON.stringify(err, null, 2)); 
    }
}

runTest();
