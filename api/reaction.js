import { createClient } from '@supabase/supabase-js';

// TULIS LANGSUNG DI SINI (Jangan pakai tanda kurung)
const SUPABASE_URL = 'https://grhmxiqrppojqqbrczds.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyaG14aXFycHBvanFxYnJjemRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDkyODY2NSwiZXhwIjoyMTEwNTA0NjY1fQ.SKG_4B0N0sqRCv_7y-8ZTXUnWZTS5wdbr-vHajlHjMM'; 
const API_KEY = 'zyxellvar';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, emojis, deviceId } = req.body;

  try {
    // 1. Cek User & Limit di Supabase
    let { data: user, error: fetchError } = await supabase.from('users').select('*').eq('device_id', deviceId).single();
    
    // TAMBAHAN: Cek jika ada error selain "data tidak ditemukan"
    if (fetchError && fetchError.code !== 'PGRST116') {
      return res.status(500).json({ status: false, error: 'DB Error (Cek User): ' + fetchError.message });
    }
    
    if (!user) {
      const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { data: newUser, error: insertError } = await supabase.from('users').insert([{ device_id: deviceId, request_count: 0, reset_at: resetAt }]).select().single();
      
      // TAMBAHAN: Cek jika gagal insert (misal tabel belum dibuat)
      if (insertError) {
        return res.status(500).json({ status: false, error: 'DB Error (Buat User): ' + insertError.message });
      }
      user = newUser;
    } else {
      if (new Date(user.reset_at) < new Date()) {
        const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('users').update({ request_count: 0, reset_at: resetAt }).eq('device_id', deviceId);
        user.request_count = 0;
      }
    }

    if (user.request_count >= 20) {
      return res.status(429).json({ status: false, error: 'Limit harian habis. Tunggu reset.' });
    }

    // 2. Simpan request ke database
    const { data: reqData, error: reqError } = await supabase.from('requests').insert([{
      device_id: deviceId, channel_url: url, emojis: emojis, status: 'processing'
    }]).select().single();

    // TAMBAHAN: Cek jika gagal simpan request
    if (reqError) {
      return res.status(500).json({ status: false, error: 'DB Error (Simpan Request): ' + reqError.message });
    }

    // 3. Panggil API apikayz
    const apiUrl = `https://apikayz.my.id/tools/reactch?apikey=${API_KEY}&url=${encodeURIComponent(url)}&emoji=${encodeURIComponent(emojis)}`;
    const apiRes = await fetch(apiUrl);
    const apiData = await apiRes.json();

    // 4. Update status
    if (apiData.status === true) {
      await supabase.from('users').update({ request_count: user.request_count + 1 }).eq('device_id', deviceId);
      await supabase.from('requests').update({ status: 'success' }).eq('id', reqData.id);
      return res.status(200).json({ status: true, message: 'Sukses' });
    } else {
      const errorMsg = apiData.error || 'Gagal dari server API';
      await supabase.from('requests').update({ status: 'failed', error_message: errorMsg }).eq('id', reqData.id);
      return res.status(400).json({ status: false, error: errorMsg });
    }

  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
}
