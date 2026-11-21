import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL; 
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; 
const API_KEY = process.env.APIKAYZ_KEY || 'zyxellvar'; 

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("FATAL: SUPABASE_URL atau SUPABASE_SERVICE_KEY belum diisi di Vercel!");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { url, emojis, deviceId } = req.body || {};

  if (!url || !emojis || !deviceId) {
    return res.status(400).json({ success: false, error: 'Data tidak lengkap.' });
  }

  let reqDataId = null; 
  let currentUser = null; 

  try {
    let { data: user, error: fetchError } = await supabase.from('users').select('*').eq('device_id', deviceId).maybeSingle();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      return res.status(500).json({ success: false, error: 'DB Error: ' + fetchError.message });
    }
    
    if (!user) {
      const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { data: newUser, error: insertError } = await supabase.from('users').insert([{ 
        device_id: deviceId, 
        request_count: 0, 
        reset_at: resetAt 
      }]).select().single();
      
      if (insertError) return res.status(500).json({ success: false, error: 'DB Error (Buat User): ' + insertError.message });
      user = newUser;
    } else {
      if (new Date(user.reset_at) < new Date()) {
        const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('users').update({ request_count: 0, reset_at: resetAt }).eq('device_id', deviceId);
        user.request_count = 0;
      }
    }

    currentUser = user;

    if (user.request_count >= 20) {
      return res.status(429).json({ success: false, error: 'Limit harian habis.' });
    }

    const { data: reqData, error: reqError } = await supabase.from('requests').insert([{
      device_id: deviceId, channel_url: url, emojis: emojis, status: 'processing'
    }]).select().single();

    if (reqError) return res.status(500).json({ success: false, error: 'DB Error (Req): ' + reqError.message });
    reqDataId = reqData.id;

    // ====================================================================================
    // TRIK BARU: Mencoba format pengiriman yang berbeda
    // ====================================================================================
    // 1. Bersihkan spasi
    const cleanEmojis = emojis.replace(/\s+/g, ''); 
    
    // TRIK: Beberapa API lebih suka emoji dipisahkan dengan spasi (%20) bukan koma
    const formattedEmojis = cleanEmojis.split(',').join(' '); 
    const encodedEmojis = encodeURIComponent(formattedEmojis);
    
    // Kita juga coba ubah nama parameter dari 'emoji' menjadi 'emojis' (banyak API typo)
    const apiUrl = `https://apikayz.my.id/tools/rch?apikey=${API_KEY}&url=${encodeURIComponent(url)}&emojis=${encodedEmojis}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8500); 

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
      await supabase.from('requests').update({ status: 'failed', error_message: 'API Server down/memblokir.' }).eq('id', reqDataId);
      return res.status(500).json({ success: false, error: 'API apikayz down/memblokir server.' });
    }

    if (apiData.status === true || apiData.success === true) {
      await supabase.from('users').update({ request_count: currentUser.request_count + 1 }).eq('device_id', deviceId);
      await supabase.from('requests').update({ status: 'success' }).eq('id', reqDataId);
      return res.status(200).json({ success: true, message: 'Sukses' }); 
    } else {
      const errorMsg = apiData.error || apiData.message || 'Gagal dari API';
      await supabase.from('requests').update({ status: 'failed', error_message: errorMsg }).eq('id', reqDataId);
      return res.status(400).json({ success: false, error: errorMsg });
    }

  } catch (error) {
    let errorMsg = error.message;
    
    if (error.name === 'AbortError') {
        errorMsg = 'Proses memakan waktu lama. Sistem menganggap reaction berhasil dikirim. Silakan cek channel WhatsApp Anda.';
        if (reqDataId && currentUser) {
            await supabase.from('users').update({ request_count: currentUser.request_count + 1 }).eq('device_id', deviceId);
            await supabase.from('requests').update({ status: 'success', error_message: 'Timeout terdeteksi. Diasumsikan berhasil.' }).eq('id', reqDataId);
        }
        return res.status(200).json({ success: true, message: errorMsg });
    }
    
    if (reqDataId) await supabase.from('requests').update({ status: 'failed', error_message: errorMsg }).eq('id', reqDataId);
    return res.status(500).json({ success: false, error: errorMsg });
  }
}