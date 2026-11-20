import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  global: { headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}` } }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { deviceId } = req.query;
  if (!deviceId) return res.status(400).json({ success: false, error: 'Device ID required' });

  try {
    // 1. Ambil data user (untuk limit dan reset_at)
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (userError) throw userError;

    // Jika user belum ada di database, buatkan default (20 limit)
    if (!user) {
      const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ device_id: deviceId, request_count: 0, reset_at: resetAt }])
        .select()
        .single();
      
      if (insertError) throw insertError;
      user = newUser;
    } else {
      // Cek jika limit sudah lewat 24 jam, reset otomatis
      if (new Date(user.reset_at) < new Date()) {
        const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('users').update({ request_count: 0, reset_at: resetAt }).eq('device_id', deviceId);
        user.request_count = 0;
        user.reset_at = resetAt;
      }
    }

    // 2. Ambil riwayat request user
    const { data: requests, error: reqError } = await supabase
      .from('requests')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(100); // Ambil 100 riwayat terakhir

    if (reqError) throw reqError;

    return res.status(200).json({ 
      success: true, 
      user: user, 
      requests: requests || [] 
    });

  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}