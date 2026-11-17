export default async function handler(req, res) {
  const { url, emoji } = req.query;
  const API_KEY = 'zyxellvar'; // Bisa diganti nanti

  try {
    // Panggil API dari server Vercel, bebas dari CORS
    const response = await fetch(`https://apikayz.my.id/tools/reactch?apikey=${API_KEY}&url=${encodeURIComponent(url)}&emoji=${encodeURIComponent(emoji)}`);
    const data = await response.json();
    
    // Teruskan respon asli dari API ke frontend kita
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}