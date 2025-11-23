import { createClient } from '@supabase/supabase-js';

// Helper function to safely access environment variables
// This handles scenarios where import.meta.env might be undefined
const getEnvVar = (key: string): string => {
  try {
    // Check process.env first (common in this environment based on Gemini usage)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] || '';
    }
    // Check import.meta.env (standard Vite)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key] || '';
    }
  } catch (e) {
    console.warn(`Error accessing env var ${key}`, e);
  }
  return '';
};

// Use environment variables if available, otherwise fall back to the provided hardcoded credentials
// This ensures the app works even if env vars aren't explicitly set in the runtime environment
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://yqthvrupdpxfnmvuvkgi.supabase.co';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdGh2cnVwZHB4Zm5tdnV2a2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODUxMTEsImV4cCI6MjA3OTE2MTExMX0.9EEV3GX35mHPXrL0i3kj7efc6Q2rL9Fya-Cd_SxuA04';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Database features will not work properly.');
}

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey
);