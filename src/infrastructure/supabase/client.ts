import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fujlictajoatyidwcmnb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1amxpY3Rham9hdHlpZHdjbW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2OTI3NzUsImV4cCI6MjA4MTI2ODc3NX0.VAY1rF-Qlmb-2ecjtT_GT__e2ZawdRT8634fAXJl9rQ';

// Create Supabase client with auth persistence
// Session stays active until explicit logout
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,          // Keep session in localStorage
    autoRefreshToken: true,         // Auto-refresh tokens before expiry
    detectSessionInUrl: true,       // Detect OAuth sessions in URL
    storageKey: 'sudani-sales-auth', // Custom storage key
  },
});
