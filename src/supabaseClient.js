import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url_here') {
  throw new Error(
    'Missing Supabase URL. Please set VITE_SUPABASE_URL in your .env file.\n' +
    'Get your credentials from: https://app.supabase.com/project/_/settings/api'
  )
}

if (!supabaseKey || supabaseKey === 'your_supabase_anon_key_here') {
  throw new Error(
    'Missing Supabase Anon Key. Please set VITE_SUPABASE_ANON_KEY in your .env file.\n' +
    'Get your credentials from: https://app.supabase.com/project/_/settings/api'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
