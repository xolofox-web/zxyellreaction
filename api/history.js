import { createClient } from '@supabase/supabase-js';

// TULIS LANGSUNG DI SINI
const SUPABASE_URL = 'https://grhmxiqrppojqqbrczds.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyaG14aXFycHBvanFxYnJjemRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDkyODY2NSwiZXhwIjoyMTEwNTA0NjY1fQ.SKG_4B0N0sqRCv_7y-8ZTXUnWZTS5wdbr-vHajlHjMM'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  const { deviceId } = req.query;
  if (!deviceId) return res.status(400).json({ error: 'Device ID required' });

  try {
    const { data: requests } = await supabase.from('requests').select('*').eq('device_id', deviceId).order('created_at', { ascending: false });
    const { data: user } = await supabase.from('users').select('*').eq('device_id', deviceId).single();

    res.status(200).json({ 
      requests: requests || [], 
      limit: user ? { count: user.request_count, reset_at: user.reset_at } : { count: 0, reset_at: null }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
