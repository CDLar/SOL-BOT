const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

const now = new Date();
const pad = n => String(n).padStart(2, '0');

const DAILY_TABLE = `eu9_${now.getUTCFullYear()}_${pad(now.getUTCMonth() + 1)}_${pad(now.getUTCDate())}`;

module.exports = { supabase, DAILY_TABLE };
