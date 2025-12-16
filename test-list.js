
import { listAppointments } from './dist/tools/appointments.js';
import dotenv from 'dotenv';
dotenv.config();

async function testPortugueseMapping() {
    console.log("--- TESTE DE LEITURA (SCHEMA PORTUGUÊS) ---");
    console.log("Tabela alvo esperada: 'agendamentos'");
    
    try {
        console.log("Executando listAppointments()...");
        const agendamentos = await listAppointments({});
        
        console.log("✅ SUCESSO! Conexão realizada.");
        console.log(`📊 Agendamentos encontrados: ${agendamentos.length}`);
        
        if (agendamentos.length > 0) {
            console.log("📝 Exemplo do primeiro registro:");
            console.log(JSON.stringify(agendamentos[0], null, 2));
        } else {
            console.log("ℹ️ Tabela vazia (mas a query funcionou, ou teria dado erro).");
        }
    } catch (err) {
        console.error("❌ ERRO NO TESTE:", err.message);
    }
}

testPortugueseMapping();
