import { supabase } from '../supabase.js';

export const getOrCreatePatient = async (args: { phone?: string; cpf?: string; name: string; organization_id: string; email?: string }) => {
    console.log(`[LOGIC] Get or Create Patient: ${args.name} (${args.phone || args.cpf})`);

    // 1. Try to find the patient first
    let searchEndpoint = '';
    let searchParams: any = { organizacao_id: args.organization_id };

    if (args.phone) {
        searchEndpoint = 'patients-api/search-by-phone';
        searchParams.telefone = args.phone;
    } else if (args.cpf) {
        searchEndpoint = 'patients-api/search';
        searchParams.q = args.cpf;
        searchParams.search_type = 'cpf';
    } else {
        // If we only have name, we can try search by name, but creating based on just name might be weak.
        // Assuming we proceed with name search.
        searchEndpoint = 'patients-api/search';
        searchParams.q = args.name;
        searchParams.search_type = 'name';
    }

    const qs = new URLSearchParams(searchParams);
    // Note: Reusing the same service role key logic
    const searchUrl = `${process.env.SUPABASE_URL}/functions/v1/${searchEndpoint}?${qs.toString()}`;
    
    try {
        const searchRes = await fetch(searchUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, 
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || ''
            } as Record<string, string>
        });

        if (searchRes.ok) {
            const found = await searchRes.json();
            // The API usually returns a list or a single object. 
            // If list and not empty => return first.
            // If object and not error => return it.
            if (Array.isArray(found) && found.length > 0) {
                console.log(`[LOGIC] Patient found: ${found[0].id}`);
                return found[0];
            } else if (found && found.id) {
                 console.log(`[LOGIC] Patient found: ${found.id}`);
                 return found;
            }
        }
        // If 404 or empty list, proceed to create.
    } catch (e) {
        console.warn("[LOGIC] Search failed or error, proceeding to try creation if applicable", e);
    }

    // 2. Not found, Create new patient
    console.log(`[LOGIC] Patient not found. Creating new...`);
    
    // We need at least Phone to create robustly according to common flows, 
    // but the API create example had CPF/Email too. We pass what we have.
    // 'nome_completo' is required.
    
    const createBody = {
        organizacao_id: args.organization_id,
        nome_completo: args.name,
        telefone: args.phone,
        cpf: args.cpf,
        email: args.email
    };

    const createUrl = `${process.env.SUPABASE_URL}/functions/v1/patients-api/create`;
    
    const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, 
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
            'Content-Type': 'application/json'
        } as Record<string, string>,
        body: JSON.stringify(createBody)
    });

    if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error(`Failed to create patient: ${errText}`);
    }

    const newPatient = await createRes.json();
    console.log(`[LOGIC] New patient created: ${newPatient.id}`);
    return newPatient;
};

export const scheduleAppointment = async (args: { 
    patient_id: string; 
    doctor_id: string; 
    date: string; 
    duration?: number; 
    notes?: string; 
    organization_id: string;
    branch_id: string;         // Added branch_id
    appointment_type?: string; 
    request_reason?: string;   
    session_id?: string;       
}) => {
    
    // Calculate duration in minutes (Default 60 if not provided, based on screenshot)
    const durationMinutes = args.duration || 60; 
    
    // Construct Observacoes with extra context if needed
    let finalNotes = args.notes || "Agendamento criado via MCP";
    if (args.request_reason) finalNotes += ` | Solicitação: ${args.request_reason}`;
    if (args.session_id) finalNotes += ` | Session: ${args.session_id}`;

    const { data, error } = await supabase
        .from('agendamentos')
        .insert([
            {
                paciente_id: args.patient_id,
                medico_id: args.doctor_id,
                filial_id: args.branch_id, // Mapped to DB column
                data_hora: args.date,
                duracao_minutos: durationMinutes,
                observacoes: finalNotes,
                organizacao_id: args.organization_id, 
                tipo_consulta: args.appointment_type || 'presencial', 
                status: 'agendado' 
            }
        ])
        .select()
        .single();

    if (error) throw new Error(`Failed to schedule appointment: ${error.message}`);
    return data;
};

export const listAppointments = async (args: { doctor_id?: string; patient_id?: string; date?: string; status_filter?: 'active' | 'history' }) => {
    // If we have a specific endpoint for doctor schedule, use it?
    // The CURL `doctors-api/{id}/schedule` strongly suggests it.
    
    if (args.doctor_id) {
        // Try to use the API for doctor's schedule
        const baseUrl = `${process.env.SUPABASE_URL}/functions/v1/doctors-api/${args.doctor_id}/schedule`;
        // It might need date params
        const params = new URLSearchParams();
        if (args.date) params.append('date', args.date); // Guessing param name
        
        try {
             const response = await fetch(`${baseUrl}?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, 
                    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || ''
                } as Record<string, string>
            });
            if (response.ok) return await response.json();
            // If fails, fallback to DB?
            console.warn("Doctor Schedule API failed, falling back to DB");
        } catch (e) {
            console.warn("Doctor Schedule API error", e);
        }
    }

    // FALLBACK: Logic DB (Refined)
    let query = supabase.from('agendamentos').select(`
        *,
        pacientes ( nome_completo ),
        medicos ( nome_completo )
    `);

    if (args.doctor_id) query = query.eq('medico_id', args.doctor_id);
    if (args.patient_id) query = query.eq('paciente_id', args.patient_id);
    if (args.date) {
        const startOfDay = new Date(args.date).toISOString();
        const endOfDay = new Date(new Date(args.date).getTime() + 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('data_hora', startOfDay).lt('data_hora', endOfDay);
    }
    
    if (args.status_filter === 'active') {
        query = query.neq('status', 'cancelado').gte('data_hora', new Date().toISOString());
        query = query.order('data_hora', { ascending: true });
    } else {
        query = query.order('data_hora', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to list appointments: ${error.message}`);
    
    return data;
};

export const checkAvailability = async (args: { doctor_id: string; branch_id: string; date_from: string; date_to: string }) => {
    console.log(`[LOGIC] Checking availability for ${args.date_from} to ${args.date_to}`);
    
    // 1. First Attempt: Check the requested range
    const searchParams = new URLSearchParams({
        doctor_id: args.doctor_id,
        branch_id: args.branch_id,
        date_from: args.date_from,
        date_to: args.date_to
    });

    const { data: slots, error } = await supabase.functions.invoke(`availability-api?${searchParams.toString()}`, {
        method: 'GET'
    });

    if (error) {
        console.error("Edge Function Error (Primary):", error);
        throw new Error(`Availability Check Failed: ${error.message}`);
    }

    // Helper to format response strictly as requested
    const formatResponse = (status: string, firstSlot: any = null, note: string = "") => {
        return {
            status: status,
            filial_id: args.branch_id,
            medico_id: args.doctor_id,
            range_consultado: {
                date_from: args.date_from,
                date_to: args.date_to
            },
            first_slot: firstSlot ? {
                local_start: firstSlot.start, // Assuming Edge Function returns 'start'
                local_end: firstSlot.end     // Assuming Edge Function returns 'end'
            } : null,
            note: note
        };
    };

    // 2. Analysis & Fallback Logic
    // Note: The API returns { availability: [...] }, so we need to extract it
    const availableSlots = (slots && slots.availability) ? slots.availability : (Array.isArray(slots) ? slots : []);
    const hasAvailableSlot = availableSlots.length > 0;

    if (hasAvailableSlot) {
        // SUCCESS: Found in range
        return formatResponse("AVAILABLE", availableSlots[0], "Slots found in requested range.");
    }

    // 3. FALLBACK: Nothing found, trigger 90-day search automatically
    console.log(`[LOGIC] No slots found. Triggering 90-day fallback search...`);

    const fallbackDateFrom = new Date(args.date_to);
    fallbackDateFrom.setDate(fallbackDateFrom.getDate() + 1); // Start from day after
    
    const fallbackDateTo = new Date();
    fallbackDateTo.setDate(fallbackDateTo.getDate() + 90); // Look 90 days ahead

    const fallbackParams = new URLSearchParams({
        doctor_id: args.doctor_id,
        branch_id: args.branch_id,
        date_from: fallbackDateFrom.toISOString().split('T')[0],
        date_to: fallbackDateTo.toISOString().split('T')[0]
    });

    const { data: fallbackSlots, error: fallbackError } = await supabase.functions.invoke(`availability-api?${fallbackParams.toString()}`, {
        method: 'GET'
    });

    if (fallbackError) {
         console.error("Edge Function Error (Fallback):", fallbackError);
         // Return specialized error or failsafe
         return formatResponse("ERROR", null, "Failed to execute fallback search.");
    }

    const fallbackList = (fallbackSlots && fallbackSlots.availability) ? fallbackSlots.availability : (Array.isArray(fallbackSlots) ? fallbackSlots : []);
    
    if (fallbackList.length > 0) {
        // SUCCESS: Found in fallback
        return formatResponse("UNAVAILABLE_IN_RANGE", fallbackList[0], "Found availability in next 90 days.");
    } else {
        // FAILURE: Truly blocked
        return formatResponse("BLOCKED_90D", null, "No availability found in the next 90 days.");
    }
};

export const cancelAppointment = async (args: { appointment_id: string; reason?: string }) => {
    const { data, error } = await supabase
        .from('agendamentos')
        .update({ status: 'cancelado', observacoes: args.reason ? `Cancelado: ${args.reason}` : undefined })
        .eq('id', args.appointment_id)
        .select()
        .single();

    if (error) throw new Error(`Failed to cancel appointment: ${error.message}`);
    return data;
};

export const updateAppointment = async (args: { appointment_id: string; start_time?: string; end_time?: string; notes?: string }) => {
    // SECURITY CHECK: Get current status first
    const { data: current, error: fetchError } = await supabase
        .from('agendamentos')
        .select('status, data_hora')
        .eq('id', args.appointment_id)
        .single();
    
    if (fetchError || !current) {
        throw new Error("Appointment not found");
    }

    if (current.status === 'cancelado') {
        throw new Error("OPERATION BLOCKED: Cannot update a cancelled appointment. Please create a new one using schedule_appointment.");
    }

    const updates: any = {};
    
    if (args.notes) updates.observacoes = args.notes;
    
    if (args.start_time || args.end_time) {
        if (args.start_time && args.end_time) {
            updates.data_hora = args.start_time;
            const start = new Date(args.start_time);
            const end = new Date(args.end_time);
            updates.duracao_minutos = (end.getTime() - start.getTime()) / (1000 * 60);
        } else if (args.start_time) {
             updates.data_hora = args.start_time;
             // Keep existing duration? Yes.
        } else if (args.end_time) {
             const start = new Date(current.data_hora);
             const end = new Date(args.end_time);
             updates.duracao_minutos = (end.getTime() - start.getTime()) / (1000 * 60);
        }
    }

    const { data, error } = await supabase
        .from('agendamentos')
        .update(updates)
        .eq('id', args.appointment_id)
        .select()
        .single();

    if (error) throw new Error(`Failed to update appointment: ${error.message}`);
    return data;
};
