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
  let currentUser = null; // Simpan data user untuk digunakan di blok catch

  try {
    // 1. Cek User & Limit
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
      
      if (insertError) {
         return res.status(500).json({ success: false, error: 'DB Error (Buat User): ' + insertError.message });
      }
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

    // 2. Simpan request (Status processing)
    const { data: reqData, error: reqError } = await supabase.from('requests').insert([{
      device_id: deviceId, channel_url: url, emojis: emojis, status: 'processing'
    }]).select().single();

    if (reqError) {
        return res.status(500).json({ success: false, error: 'DB Error (Req): ' + reqError.message });
    }
    reqDataId = reqData.id;

    // 3. Panggil API Eksternal
    const apiUrl = `https://apikayz.my.id/tools/rch?apikey=${API_KEY}&url=${encodeURIComponent(url)}&emoji=${encodeURIComponent(emojis)}`;
    
    const controller = new AbortController();
    // FIX: Dinaikkan ke 8500ms (8.5 detik) agar tidak kena limit 10 detik Vercel
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

    // 4. Update status berdasarkan respon API Eksternal
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
    
    // FIX UTAMA: Tangani Timeout sebagai SUKSES (Karena apikayz biasanya tetap memproses di background)
    if (error.name === 'AbortError') {
        errorMsg = 'Proses memakan waktu lama. Sistem menganggap reaction berhasil dikirim. Silakan cek channel WhatsApp Anda.';
        
        if (reqDataId && currentUser) {
            // Tetap potong limit user agar tidak bisa spam gratis
            await supabase.from('users').update({ request_count: currentUser.request_count + 1 }).eq('device_id', deviceId);
            
            // Ubah status menjadi success dengan catatan timeout
            await supabase.from('requests').update({ 
                status: 'success', 
                error_message: 'Timeout terdeteksi. Diasumsikan berhasil.' 
            }).eq('id', reqDataId);
        }
        
        // Kembalikan response SUKSES ke frontend agar muncul notif hijau
        return res.status(200).json({ success: true, message: errorMsg });
    }
    
    // Jika error bukan timeout (misal koneksi putus total)
    if (reqDataId) {
      await supabase.from('requests').update({ status: 'failed', error_message: errorMsg }).eq('id', reqDataId);
    }
    
    return res.status(500).json({ success: false, error: errorMsg });
  }
}