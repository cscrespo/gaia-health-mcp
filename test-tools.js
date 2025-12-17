import fetch from 'node-fetch';

async function testTool(name, payload) {
    console.log(`\n--- Testing ${name} ---`);
    console.log(`Payload:`, JSON.stringify(payload, null, 2));
    
    try {
        const res = await fetch(`http://localhost:3000/tools/${name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            console.error(`Error: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error(`Response: ${text}`);
            return;
        }

        const data = await res.json();
        console.log(`Success! Response:`);
        console.log(JSON.stringify(data, null, 2));

    } catch (e) {
        console.error(`Exception: ${e.message}`);
    }
}

async function run() {
    // 1. Check Availability
    await testTool('check_availability', {
        doctor_id: "ec8be3b7-2036-4948-9416-9cbf36cf10e6",
        branch_id: "f8012fbf-c8e4-47d2-99db-90c9022f6e61",
        date_from: "2025-12-18T09:00:00", 
        date_to: "2025-12-18T17:00:00"
    });

    // 2. List Appointments
    await testTool('list_appointments', {
        doctor_id: "ec8be3b7-2036-4948-9416-9cbf36cf10e6",
        status_filter: "active"
    });
}

run();
