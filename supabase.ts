import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kejxkwodslembupvofdi.supabase.co';
const supabaseKey = 'sb_publishable_yAZ4rtqoTOrUjaicTZJ0dw_dysuu9Q4';

export const supabase = createClient(supabaseUrl, supabaseKey);