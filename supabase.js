const SUPABASE_URL = "https://ylsoalheqmpktgadwtqs.supabase.co";
const SUPABASE_KEY = "sb_publishable_i_pFQXiblcO8picaVNCiIQ_-1PxnlVR";
const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function saveToCloud() {
  try {
    const data = JSON.parse(localStorage.getItem('ngt_db') || '{}');
    await _sb.from('app_data').upsert({ id: 1, data: data, updated_at: new Date().toISOString() });
  } catch(e){ console.log(e); }
}

async function loadFromCloud() {
  try {
    const { data } = await _sb.from('app_data').select('data').eq('id', 1).single();
    if (data && data.data && Object.keys(data.data).length > 0) {
      localStorage.setItem('ngt_db', JSON.stringify(data.data));
      return true;
    }
  } catch(e){ console.log(e); }
  return false;
}

const _origSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function(k, v) {
  _origSetItem(k, v);
  if (k === 'ngt_db') saveToCloud();
};