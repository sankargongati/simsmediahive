import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

const { createClient } = supabase;
export const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);