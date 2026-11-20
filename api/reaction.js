import { createClient } from '@supabase/supabase-js';

// FIX: JANGAN HARDCODE KEY. Gunakan Environment Variables di Vercel!
const SUPABASE_URL = process.env.SUPABASE_URL; 
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; 
const API_KEY = process.env.APIKAYZ_KEY || 'zyxellvar'; // Disarankan pindah ke env juga

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { url, emojis, deviceId } = req.body || {};

  if (!url || !emojis || !deviceId) {
    return res.status(400).json({ success: false, error: 'Data tidak lengkap.' });
  }

  let reqDataId = null; // Untuk menyimpan ID request agar bisa di-update jika gagal

  try {
    // 1. Cek User & Limit
    let { data: user, error: fetchError } = await supabase.from('users').select('*').eq('device_id', deviceId).single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      return res.status(500).json({ success: false, error: 'DB Error: ' + fetchError.message });
    }
    
    if (!user) {
      const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { data: newUser, error: insertError } = await supabase.from('users').insert([{ device_id: deviceId, request_count: 0, reset_at: resetAt }]).select().single();
      if (insertError) return res.status(500).json({ success: false, error: 'DB Error (Buat User): ' + insertError.message });
      user = newUser;
    } else {
      if (new Date(user.reset_at) < new Date()) {
        const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('users').update({ request_count: 0, reset_at: resetAt }).eq('device_id', deviceId);
        user.request_count = 0;
      }
    }

    if (user.request_count >= 20) {
      return res.status(429).json({ success: false, error: 'Limit harian habis.' });
    }

    // 2. Simpan request (Status processing)
    const { data: reqData, error: reqError } = await supabase.from('requests').insert([{
      device_id: deviceId, channel_url: url, emojis: emojis, status: 'processing'
    }]).select().single();

    if (reqError) return res.status(500).json({ success: false, error: 'DB Error (Req): ' + reqError.message });
    reqDataId = reqData.id;

    // 3. Panggil API
    const apiUrl = `https://apikayz.my.id/tools/rch?apikey=${API_KEY}&url=${encodeURIComponent(url)}&emoji=${encodeURIComponent(emojis)}`;
    
    const controller = new AbortController();
    // FIX: Timeout diturunkan jadi 6 detik agar Vercel tidak kena 504 (Batas Vercel 10s, sisakan waktu untuk DB)
    const timeoutId = setTimeout(() => controller.abort(), 6000); 

    const apiRes = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const apiText = await apiRes.text();
    let apiData;
    
    try {
      apiData = JSON.parse(apiText);
    } catch (e) {
      // FIX: Update database jika API mengembalikan HTML (Down)
      await supabase.from('requests').update({ status: 'failed', error_message: 'API Server down/memblokir.' }).eq('id', reqDataId);
      return res.status(500).json({ success: false, error: 'API apikayz down/memblokir server.' });
    }

    // 4. Update status
    // FIX: Cek status dari API (sesuaikan dengan format apikayz)
    if (apiData.status === true || apiData.success === true) {
      await supabase.from('users').update({ request_count: user.request_count + 1 }).eq('device_id', deviceId);
      await supabase.from('requests').update({ status: 'success' }).eq('id', reqDataId);
      return res.status(200).json({ success: true, message: 'Sukses' }); // Gunakan 'success' agar sinkron dengan frontend
    } else {
      const errorMsg = apiData.error || apiData.message || 'Gagal dari API';
      await supabase.from('requests').update({ status: 'failed', error_message: errorMsg }).eq('id', reqDataId);
      return res.status(400).json({ success: false, error: errorMsg });
    }

  } catch (error) {
    // FIX: Tangani error (termasuk AbortError) dan update database agar tidak tertahan di 'processing'
    let errorMsg = error.message;
    if (error.name === 'AbortError') {
        errorMsg = 'Timeout: API apikayz terlalu lama merespons.';
    }
    
    if (reqDataId) {
      await supabase.from('requests').update({ status: 'failed', error_message: errorMsg }).eq('id', reqDataId);
    }
    
    return res.status(500).json({ success: false, error: errorMsg });
  }
}