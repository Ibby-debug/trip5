/**
 * Order status: new inserts use "pending". Ops may set completed/cancelled/confirmed later.
 * Terminal statuses are excluded from the "active" upcoming card.
 */
export const TERMINAL_STATUSES = new Set(['completed', 'cancelled']);

export function isTerminalStatus(status) {
  return TERMINAL_STATUSES.has(String(status || '').toLowerCase());
}

/**
 * @param {Array<object>} rows - orders from Supabase
 * @param {Date} [now]
 * @returns {{ active: object | null, history: object[] }}
 */
export function partitionBookings(rows, now = new Date()) {
  const list = Array.isArray(rows) ? [...rows] : [];
  const t = now.getTime();

  const nonTerminalFuture = list.filter((r) => {
    if (isTerminalStatus(r.status)) return false;
    const scheduled = new Date(r.scheduled_at).getTime();
    return scheduled >= t;
  });
  nonTerminalFuture.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const active = nonTerminalFuture[0] || null;
  const activeId = active?.id;

  const history = list
    .filter((r) => r.id !== activeId)
    .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));

  return { active, history };
}

export function formatBookingDate(isoString, locale) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const loc = locale === 'ar' ? 'ar-JO' : 'en-JO';
  return d.toLocaleString(loc, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function pickupSummary(pickup) {
  if (!pickup || typeof pickup !== 'object') return '';
  const a = pickup.address;
  return typeof a === 'string' && a.trim() ? a.trim() : '';
}

export function destinationSummary(destination) {
  if (!destination || typeof destination !== 'object') return '';
  if (destination.pending) return '—';
  const a = destination.address;
  return typeof a === 'string' && a.trim() ? a.trim() : '';
}
