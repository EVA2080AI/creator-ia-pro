import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar .env desde la raíz
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const PROJECT_ID = process.env.VITE_SUPABASE_PROJECT_ID;

console.log('--- DIAGNÓSTICO DE SUPABASE ---');
console.log('Project ID:', PROJECT_ID);
console.log('URL:', SUPABASE_URL);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Faltan variables de entorno en .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runDiagnostic() {
  try {
    console.log('Probando conexión a tabla "profiles"...');
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error('❌ Error de consulta:', error.message);
    } else {
      console.log('✅ Conexión Exitosa: Tabla "profiles" alcanzable.');
    }

    console.log('Probando conexión a tabla "agent_preferences"...');
    const { error: agentError } = await supabase.from('agent_preferences').select('id').limit(1);
    
    if (agentError) {
      console.error('❌ Error de consulta (agent_preferences):', agentError.message);
    } else {
      console.log('✅ Conexión Exitosa: Tabla "agent_preferences" alcanzable.');
    }

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

runDiagnostic();
