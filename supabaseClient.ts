import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://voqgmexwlcpkzvqhqels.supabase.co'
const supabaseAnonKey = 'sb_publishable_LVT0F0nhBicJo-xkNfbgtg_quYX_4MD'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
