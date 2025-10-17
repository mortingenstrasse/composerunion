// ComposerUnion.com - Supabase Configuration
// Replace with your actual Supabase URL and Anon Key

const SUPABASE_URL = 'https://qznimpzqpvuqkqbvfauh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bmltcHpxcHZ1cWtxYnZmYXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTMwODcsImV4cCI6MjA3NjEyOTA4N30.2lLPRuJu86fhimjyoWxL3Z36NkBUt2BCcCRUznyNS_Y';

// Initialize Supabase client
// IMPORTANT: This assumes the Supabase library is loaded via CDN in your HTML
// The library exposes a global 'supabase' object with a createClient method
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

