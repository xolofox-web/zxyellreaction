export default async function handler(req, res) {
  const { url, emoji } = req.query;
  const API_KEY = 'zyxellvar';

  // Base URL yang kamu minta
  const baseUrl = 'https://apikayz.my.id/tools/reactch';
  
  // Membuat parameter (apikey, url, emoji) persis seperti params di axios
  const params = new URLSearchParams({
    apikey: API_KEY,
    url: url,
    emoji: emoji
  });

  // Menggabungkan base URL dengan parameter
  // Hasilnya akan persis seperti contohmu: 
  // https://apikayz.my.id/tools/reactch?apikey=zyxellvar&url=https%3A%2F%2Fwhatsapp...&emoji=%F0%9F%8D%86
  const fullUrl = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(fullUrl);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
}