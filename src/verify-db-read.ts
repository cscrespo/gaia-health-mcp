
import { listAppointments } from './tools/appointments.js';

async function runTest() {
    console.log("Starting Read-Only Database Test...");
    try {
        // Fetching appointments without filters to test general access
        const appointments = await listAppointments({});
        console.log("Successfully connected to Supabase!");
        console.log(`Found ${appointments?.length ?? 0} appointments.`);
        if (appointments && appointments.length > 0) {
            console.log("Sample Data (first 2):", JSON.stringify(appointments.slice(0, 2), null, 2));
        } else {
            console.log("No appointments found (expected if DB is empty, but connection worked).");
        }
    } catch (err) {
        console.error("Test Failed:", err);
        process.exit(1);
    }
}

runTest();
