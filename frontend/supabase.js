import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://oaegfqhdbxznblndlttz.supabase.co"
const supabaseKey = "sb_publishable_q1T2fod_zYAmpHGF1eMTKw_cxPMNJIL"

export const supabase = createClient(supabaseUrl, supabaseKey)