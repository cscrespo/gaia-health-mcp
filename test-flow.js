
async function run() {
    // 1. Get/Create Patient
    console.log("Creating/Getting Patient...");
    const patientRes = await fetch("http://localhost:3000/tools/get_or_create_patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Teste Final Integracao",
            phone: `5511${Math.floor(Math.random() * 1000000000)}`, // Random phone
            organization_id: "db9382f3-7b85-43f5-8465-72ee0ecd4430"
        })
    });
    
    if (!patientRes.ok) {
        console.error("Patient Error:", await patientRes.text());
        return;
    }
    
    const patientData = await patientRes.json();
    console.log("Patient Data:", JSON.stringify(patientData, null, 2));
    
    const patientId = patientData.id || (patientData.patient && patientData.patient.id); // Adjust based on return structure
    
    if (!patientId) {
        console.error("No patient ID found!");
        return;
    }

    // 2. Schedule Appointment
    console.log(`Scheduling for Patient ID: ${patientId}...`);
    const scheduleRes = await fetch("http://localhost:3000/tools/schedule_appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            patient_id: patientId,
            doctor_id: "ec8be3b7-2036-4948-9416-9cbf36cf10e6",
            organization_id: "db9382f3-7b85-43f5-8465-72ee0ecd4430",
            branch_id: "c78243d2-af47-467b-87ed-262678be169f", // Added from previous context
            date: "2026-03-15T14:00:00-03:00",
            
            // New Fields
            appointment_type: "presencial",
            request_reason: "Dor de cabeça persistente",
            session_id: "session-123-abc",
            duration: 60,
            notes: "Teste automatizado via script Node"
        })
    });

    if (!scheduleRes.ok) {
        console.error("Schedule Error:", await scheduleRes.text());
        return;
    }

    const appointment = await scheduleRes.json();
    console.log("Appointment Created:", JSON.stringify(appointment, null, 2));
}

run();
