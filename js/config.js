import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supUrl = 'https://mkmiancozvvgcantlfws.supabase.co'
const supKey = 'sb_publishable_KixEuCzaRJxd6ufRvlzCpQ_BwgS2UR-'

// "export const" use karein
export const supabase = createClient(supUrl, supKey)