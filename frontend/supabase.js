import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://lwgcsncennhwgtgevlva.supabase.co"
const supabaseKey = "sb_publishable_bTDGcaeQVTxBfFIk8pluoA_Yvko5WqM"

export const supabase = createClient(supabaseUrl, supabaseKey)