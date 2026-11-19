import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, emojis, deviceId } = req.body;

  try {
    // 1. Cek User & Limit di Supabase
    let { data: user } = await supabase.from('users').select('*').eq('device_id', deviceId).single();
    
    if (!user) {
      // Buat user baru jika belum ada
      const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { data: newUser } = await supabase.from('users').insert([{ device_id: deviceId, request_count: 0, reset_at: resetAt }]).select().single();
      user = newUser;
    } else {
      // Cek apakah waktu reset sudah lewat
      if (new Date(user.reset_at) < new Date()) {
        const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('users').update({ request_count: 0, reset_at: resetAt }).eq('device_id', deviceId);
        user.request_count = 0;
      }
    }

    // 2. Cek Limit (Maksimal 20)
    if (user.request_count >= 20) {
      return res.status(429).json({ status: false, error: 'Limit harian habis. Tunggu reset.' });
    }

    // 3. Simpan request ke database (status: processing)
    const { data: reqData } = await supabase.from('requests').insert([{
      device_id: deviceId, channel_url: url, emojis: emojis, status: 'processing'
    }]).select().single();

    // 4. Panggil API apikayz (Bebas CORS karena dari server)
    const apiUrl = `https://apikayz.my.id/tools/reactch?apikey=${process.env.API_KEY}&url=${encodeURIComponent(url)}&emoji=${encodeURIComponent(emojis)}`;
    const apiRes = await fetch(apiUrl);
    const apiData = await apiRes.json();

    // 5. Update status di database
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