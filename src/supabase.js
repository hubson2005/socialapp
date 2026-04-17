import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gxguirtpunmiiuxpxlap.supabase.co'
const SUPABASE_KEY = 'COLLE_TA_PUBLISHABLE_KEY_ICI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)