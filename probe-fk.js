
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function probeForeignKey() {
    console.log("Attempting to trigger Foreign Key error to reveal table name...");
    
    // We try to insert a lead with a random UUID as estagio_id
    const { data, error } = await supabase.from('leads').insert([
        {
            nome: "Probe Lead",
            organizacao_id: "db9382f3-7b85-43f5-8465-72ee0ecd4430", // Using known org id
            estagio_id: "00000000-0000-0000-0000-000000000000" // Bound to fail
        }
    ]);

    if (error) {
        console.log("Error received:", error.message);
        console.log("Details:", error.details);
        console.log("Hint:", error.hint);
    } else {
        console.log("Whaat? It worked? Then there is no FK constraint?");
    }
}

probeForeignKey();
