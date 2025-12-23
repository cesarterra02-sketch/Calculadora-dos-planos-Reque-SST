import { createClient } from '@supabase/supabase-js'

// Se a Vercel não fornecer os dados, ele usa os links diretos abaixo
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://voqgmexwlcpkzvqhqels.supabase.co'
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_LVT0F0nhBicJo-xkNfbgtg_quYX_4MD'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
