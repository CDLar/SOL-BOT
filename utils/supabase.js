const { createClient } = require('@supabase/supabase-js');

let _supabase = null;

function getSupabase() {
    if (!_supabase) {
        _supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
    }
    return _supabase;
}

const supabase = new Proxy({}, {
    get(_, prop) {
        return getSupabase()[prop];
    }
});

const pad = n => String(n).padStart(2, '0');

function getDailyTable() {
    const now = new Date();
    return `eu9_${now.getUTCFullYear()}_${pad(now.getUTCMonth() + 1)}_${pad(now.getUTCDate())}`;
}

module.exports = { supabase, getDailyTable };
