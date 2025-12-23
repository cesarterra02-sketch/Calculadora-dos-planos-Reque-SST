import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://voqgmexwlcpkzvqhqels.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LVT0F0nhBicJo-xkNfbgtg_quYX_4MD';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
