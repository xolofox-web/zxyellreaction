export const API_BASE = 'https://apikayz.my.id/tools/reactch';
export const API_KEY = 'zyxellvar';
export const STORAGE_PREFIX = 'wacr_';

export const DEFAULT_SETTINGS = {
  daily_limit: 20,
  max_emojis: 5,
  service_enabled: true,
  maintenance_mode: false,
  maintenance_message: 'Kami sedang melakukan pemeliharaan. Silakan kembali nanti.',
  notification_message: '',
  simulation_mode: true,
  auto_retry: true,
  max_retries: 2,
  retry_delay_seconds: 5,
  admin_password: 'admin123',
};

export const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 'a1',
    title: 'Selamat datang',
    content: 'Layanan WhatsApp Channel Reaction tersedia. 20 request per 24 jam.',
    status: 'published',
    created_at: Date.now(),
  },
];