import express from 'express';
import { z } from 'zod';
import { scheduleAppointment, listAppointments, checkAvailability, cancelAppointment, updateAppointment, getOrCreatePatient } from './tools/appointments.js';

const app = express();
app.use(express.json());

// Auth Middleware
app.use((req, res, next) => {
    const apiKey = process.env.MCP_API_KEY;
    const authHeader = req.headers['x-api-key'] || req.headers['authorization'];

    // If no key is configured on server, allow all (Open Mode) - OR block. 
    // For security, let's block if key exists, allow if not (or vice versa).
    // Better: If key IS configured, ENFORCE it.
    if (apiKey) {
        if (!authHeader || (authHeader !== apiKey && authHeader !== `Bearer ${apiKey}`)) {
            return res.status(401).json({ error: "Unauthorized: Invalid or missing API Key" });
        }
    }
    next();
});
const port = process.env.PORT || 3000;

// Governance: Tool Definitions (Contracts)
const TOOLS = [
    {
        name: "schedule_appointment",
        description: "Schedule a new appointment",
        inputSchema: {
            type: "object",
            properties: {
                patient_id: { type: "string", description: "UUID of the patient" },
                doctor_id: { type: "string", description: "UUID of the doctor" },
                date: { type: "string", description: "ISO 8601 start date timestamp" },
                duration: { type: "number", description: "Duration in minutes (optional, defaults to 60)" },
                notes: { type: "string", description: "Optional notes" },
                organization_id: { type: "string", description: "Organization ID (Required)" },
                branch_id: { type: "string", description: "Branch/Filial ID (Required)" },
                appointment_type: { type: "string", description: "Type of appointment: presencial, online, etc." },
                request_reason: { type: "string", description: "Reason/Solicitation text" },
                session_id: { type: "string", description: "Session/Phone identifier" }
            },
            required: ["patient_id", "doctor_id", "date", "organization_id", "branch_id"]
        }
    },
    {
        name: "list_appointments",
        description: "List appointments with optional filters",
        inputSchema: {
            type: "object",
            properties: {
                doctor_id: { type: "string" },
                patient_id: { type: "string" },
                date: { type: "string", description: "Date in YYYY-MM-DD format" },
                status_filter: { type: "string", enum: ["active", "history"], description: "Filter active or historical appointments" }
            }
        }
    },
    {
        name: "check_availability",
        description: "Check availability using the specialized Edge Function rules (blocked slots, shifts, etc.)",
        inputSchema: {
            type: "object",
            properties: {
                doctor_id: { type: "string", description: "ID do medico" },
                branch_id: { type: "string", description: "ID da filial" },
                date_from: { type: "string", description: "Data inicio (ISO or YYYY-MM-DD)" },
                date_to: { type: "string", description: "Data fim (ISO or YYYY-MM-DD)" },
            },
            required: ["doctor_id", "branch_id", "date_from", "date_to"]
        }
    },
    {
        name: "cancel_appointment",
        description: "Cancel an appointment",
        inputSchema: {
            type: "object",
            properties: {
                appointment_id: { type: "string" },
                reason: { type: "string" },
            },
            required: ["appointment_id"]
        }
    },
    {
        name: "update_appointment",
        description: "Update an existing appointment",
        inputSchema: {
            type: "object",
            properties: {
                appointment_id: { type: "string" },
                start_time: { type: "string" },
                end_time: { type: "string" },
                notes: { type: "string" },
            },
            required: ["appointment_id"]
        }
    },
    {
        name: "get_or_create_patient",
        description: "Search for a patient by Phone or CPF. If not found, create a new one automatically.",
        inputSchema: {
            type: "object",
            properties: {
                phone: { type: "string", description: "Patient phone number" },
                cpf: { type: "string", description: "Patient CPF" },
                name: { type: "string", description: "Patient Full Name (Required for creation)" },
                email: { type: "string", description: "Patient email (optional)" },
                organization_id: { type: "string", description: "Organization ID (Required)" }
            },
            required: ["name", "organization_id"]
        }
    }
];

// 1. Discovery Endpoint
app.get('/tools', (req, res) => {
    res.json({ tools: TOOLS });
});

// 2. Execution Endpoint
app.post('/tools/:name', async (req, res) => {
    const toolName = req.params.name;
    const args = req.body;

    console.log(`[EXEC] Tool: ${toolName}`, JSON.stringify(args));

    try {
        let result;
        switch (toolName) {
            case "schedule_appointment":
                // Governance: In a real scenario, we would validate 'args' against Zod here again if strictly needed,
                // but the DB layer or the tool function often handles types. 
                // For MCP/n8n parity, we trust the function signature validation or valid JSON types.
                result = await scheduleAppointment(args as any);
                break;
            case "list_appointments":
                result = await listAppointments(args as any);
                break;
            case "check_availability":
                result = await checkAvailability(args as any);
                break;
            case "cancel_appointment":
                result = await cancelAppointment(args as any);
                break;
            case "update_appointment":
                result = await updateAppointment(args as any);
                break;
            case "get_or_create_patient":
                result = await getOrCreatePatient(args as any);
                break;
            default:
                res.status(404).json({ error: `Tool not found: ${toolName}` });
                return;
        }
        res.json(result);
    } catch (error: any) {
        console.error(`[ERROR] ${toolName}:`, error);
        res.status(500).json({ error: error.message });
    }
});




// Export app for Vercel/Serverless
export default app;

// Only listen if not running in Vercel (local development)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`Gaia Health API (REST) running on port ${port}`);
        console.log(`Discovery: GET http://localhost:${port}/tools`);
        console.log(`Execute:   POST http://localhost:${port}/tools/:name`);
    });
}
