const WA_CHANNEL_REGEX = /^https?:\/\/(?:www\.)?whatsapp\.com\/channel\/[A-Za-z0-9_-]{10,}$/i;

export const isValidChannelUrl = (url) => WA_CHANNEL_REGEX.test(String(url || '').trim());

export function parseEmojis(input, max) {
  const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
  const raw = String(input || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!raw.length) return { error: 'Minimal satu emoji.' };
  const out = [];
  for (const r of raw) {
    const segs = Array.from(seg.segment(r));
    if (segs.length !== 1) return { error: `"${r}" bukan emoji tunggal.` };
    const ch = segs[0].segment;
    if (!/\p{Extended_Pictographic}/u.test(ch)) return { error: `"${r}" bukan emoji.` };
    out.push(ch);
  }
  if (out.length > max) return { error: `Maksimal ${max} emoji.` };
  return { emojis: out };
}