import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://grhmxiqrppojqqbrczds.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyaG14aXFycHBvanFxYnJjemRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDkyODY2NSwiZXhwIjoyMTEwNTA0NjY1fQ.SKG_4B0N0sqRCv_7y-8ZTXUnWZTS5wdbr-vHajlHjMM'; 
const API_KEY = 'zyxellvar';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, emojis, deviceId } = req.body || {};

  if (!url || !emojis || !deviceId) {
    return res.status(400).json({ status: false, error: 'Data tidak lengkap.' });
  }

  try {
    // 1. Cek User & Limit di Supabase
    let { data: user, error: fetchError } = await supabase.from('users').select('*').eq('device_id', deviceId).single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      return res.status(500).json({ status: false, error: 'DB Error (Cek User): ' + fetchError.message });
    }
    
    if (!user) {
      const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { data: newUser, error: insertError } = await supabase.from('users').insert([{ device_id: deviceId, request_count: 0, reset_at: resetAt }]).select().single();
      
      if (insertError) return res.status(500).json({ status: false, error: 'DB Error (Buat User): ' + insertError.message });
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

    if (reqError) {
      return res.status(500).json({ status: false, error: 'DB Error (Simpan Request): ' + reqError.message });
    }

    // 3. Panggil API apikayz dengan Header dan Timeout
    const apiUrl = `https://apikayz.my.id/tools/reactch?apikey=${API_KEY}&url=${encodeURIComponent(url)}&emoji=${encodeURIComponent(emojis)}`;
    
    // Tambahkan AbortController untuk timeout (misal 8 detik, di bawah limit 10 detik Vercel)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    const apiRes = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId); // Hapus timer jika berhasil

    const apiText = await apiRes.text();
    let apiData;
    
    try {
      apiData = JSON.parse(apiText);
    } catch (e) {
      // Jika apikayz mengirim HTML (diblokir/down)
      await supabase.from('requests').update({ status: 'failed', error_message: 'API apikayz memblokir request dari server.' }).eq('id', reqData.id);
      return res.status(500).json({ status: false, error: 'API apikayz memblokir request (Coba lagi nanti).' });
    }

    // 4. Update status
    if (apiData.status === true) {
      await supabase.from('users').update({ request_count: user.request_count + 1 }).eq('device_id', deviceId);
      await supabase.from('requests').update({ status: 'success' }).eq('id', reqData.id);
      return res.status(200).json({ status: true, message: 'Sukses' });
    } else {
      const errorMsg = apiData.error || 'Gagal dari request API';
      await supabase.from('requests').update({ status: 'failed', error_message: errorMsg }).eq('id', reqData.id);
      return res.status(400).json({ status: false, error: errorMsg });
    }

  } catch (error) {
    // Tangani error timeout atau jaringan
    if (error.name === 'AbortError') {
        return res.status(504).json({ status: false, error: 'Request ke API apikayz timeout (lebih dari 8 detik).' });
    }
    return res.status(500).json({ status: false, error: error.message });
  }
}