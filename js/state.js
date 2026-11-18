import { DEFAULT_SETTINGS, DEFAULT_ANNOUNCEMENTS } from './config.js';
import { DB } from './utils.js';

export const state = {
  route: 'home',
  userId: null,
  isAdmin: false,
  settings: null,
  announcements: [],
  requests: [],
  limits: {},
  blacklist: [],
  logs: [],
  apiLogs: [],
  historyFilter: { status: 'all', page: 1, pageSize: 8 },
  admin: {
    tab: 'overview',
    requestFilter: { status: 'all', search: '', page: 1, pageSize: 10 },
  },
};

export const saveRequests = () => DB.set('requests', state.requests);
export const saveLimits = () => DB.set('limits', state.limits);
export const saveSettings = () => DB.set('settings', state.settings);
export const saveAnnouncements = () => DB.set('announcements', state.announcements);
export const saveBlacklist = () => DB.set('blacklist', state.blacklist);
export const saveLogs = () => DB.set('logs', state.logs);
export const saveApiLogs = () => DB.set('api_logs', state.apiLogs);

export function logActivity(activity, description = '') {
  state.logs.unshift({
    id: 'log_' + crypto.randomUUID(),
    admin_id: state.isAdmin ? 'admin' : null,
    activity,
    description,
    created_at: Date.now(),
  });
  state.logs = state.logs.slice(0, 500);
  saveLogs();
}

export function logApi(endpoint, status, ms, error = null, httpStatus = 200) {
  state.apiLogs.unshift({
    id: 'a_' + crypto.randomUUID(),
    endpoint, status, response_time_ms: ms, error, http_status: httpStatus, created_at: Date.now(),
  });
  state.apiLogs = state.apiLogs.slice(0, 200);
  saveApiLogs();
}

export function ensureLimit() {
  const now = Date.now();
  let l = state.limits[state.userId];
  if (!l) {
    l = { request_count: 0, window_started_at: now, reset_at: now + 86400000, bonus: 0 };
    state.limits[state.userId] = l;
    saveLimits();
  } else if (l.reset_at <= now) {
    l.request_count = 0;
    l.window_started_at = now;
    l.reset_at = now + 86400000;
    saveLimits();
  }
  return l;
}

export const isBlacklisted = () => state.blacklist.some(b => b.user_id === state.userId);

export function remainingLimit() {
  const l = ensureLimit();
  const max = state.settings.daily_limit + (l.bonus || 0);
  return Math.max(0, max - l.request_count);
}

export function initState() {
  let userId = DB.get('user_id', null);
  if (!userId) { userId = 'user_' + crypto.randomUUID(); DB.set('user_id', userId); }
  state.userId = userId;

  state.settings = DB.get('settings', null) || { ...DEFAULT_SETTINGS };
  if (!DB.get('settings', null)) saveSettings();

  state.announcements = DB.get('announcements', null) || [...DEFAULT_ANNOUNCEMENTS];
  if (!DB.get('announcements', null)) saveAnnouncements();

  state.requests = DB.get('requests', []);
  state.limits = DB.get('limits', {});
  state.blacklist = DB.get('blacklist', []);
  state.logs = DB.get('logs', []);
  state.apiLogs = DB.get('api_logs', []);
  state.isAdmin = sessionStorage.getItem('wacr_admin') === '1';

  ensureLimit();
}

// ==========================================
// TAMBAHAN: FUNGSI SINKRONISASI DARI DATABASE
// ==========================================
export async function syncWithDatabase() {
  const deviceId = DB.get('user_id', null) || 'user_' + crypto.randomUUID();
  if (!DB.get('user_id', null)) DB.set('user_id', deviceId);
  state.userId = deviceId;

  try {
    const res = await fetch(`/api/history?deviceId=${deviceId}`);
    const data = await res.json();
    
    if (data.requests) {
      state.requests = data.requests;
    }
    if (data.limit) {
      state.limits[deviceId] = {
        request_count: data.limit.count,
        reset_at: data.limit.reset_at ? new Date(data.limit.reset_at).getTime() : Date.now() + 86400000
      };
    }
    return true;
  } catch (e) {
    console.error("Gagal sinkronisasi database", e);
    return false;
  }
}