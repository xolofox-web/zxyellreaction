import { state } from './state.js';
import { fmtDate, toast } from './utils.js';

function downloadCSV(filename, rows) {
  const csv = rows.map(r =>
    r.map(c => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`).join(',')
  ).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

export function exportUserCSV() {
  const list = state.requests.filter(r => r.user_id === state.userId);
  downloadCSV(`requests-${Date.now()}.csv`, [
    ['ID', 'Link', 'Emoji', 'Status', 'Error', 'Retry', 'Created', 'Completed'],
    ...list.map(r => [r.id, r.channel_url, r.emojis, r.status, r.error_message || '', r.retry_count || 0, fmtDate(r.created_at), r.completed_at ? fmtDate(r.completed_at) : ''])
  ]);
  toast('CSV diunduh.', 'success');
}

export function exportAllCSV() {
  downloadCSV(`all-requests-${Date.now()}.csv`, [
    ['ID', 'User', 'Link', 'Emoji', 'Status', 'Error', 'Retry', 'Created', 'Completed'],
    ...state.requests.map(r => [r.id, r.user_id, r.channel_url, r.emojis, r.status, r.error_message || '', r.retry_count || 0, fmtDate(r.created_at), r.completed_at ? fmtDate(r.completed_at) : ''])
  ]);
  toast('CSV diunduh.', 'success');
}

export function exportFilteredCSV(status) {
  const list = status === 'all' ? state.requests : state.requests.filter(r => r.status === status);
  downloadCSV(`requests-${status}-${Date.now()}.csv`, [
    ['ID', 'User', 'Link', 'Emoji', 'Status', 'Error', 'Created'],
    ...list.map(r => [r.id, r.user_id, r.channel_url, r.emojis, r.status, r.error_message || '', fmtDate(r.created_at)])
  ]);
  toast(`CSV "${status}" diunduh.`, 'success');
}

window.exportUserCSV = exportUserCSV;
window.exportAllCSV = exportAllCSV;
window.exportFilteredCSV = exportFilteredCSV;