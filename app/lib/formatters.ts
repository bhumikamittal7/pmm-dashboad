export function formatDuration(hours: number): string {
  if (hours <= 0 || !isFinite(hours)) return 'N/A';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = hours / 24;
  if (days < 7) return `${days.toFixed(1)}d`;
  return `${Math.round(days)}d`;
}

export function formatNumber(n: number, decimals: number = 0): string {
  if (!isFinite(n)) return 'N/A';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
}

export function formatPercent(n: number): string {
  if (!isFinite(n)) return 'N/A';
  return `${n.toFixed(1)}%`;
}

export function formatRate(n: number): string {
  if (!isFinite(n) || n <= 0) return 'N/A';
  return n.toFixed(2);
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function weekdaysInRange(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return Math.max(count, 1);
}

export function weeksInRange(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(ms / (7 * 24 * 60 * 60 * 1000), 1);
}

export function hoursBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60);
}

export function daysBetween(a: string, b: string): number {
  return hoursBetween(a, b) / 24;
}

const BOT_PATTERNS = [
  'bot', 'dependabot', 'renovate', 'github-actions', 'codecov',
  'greenkeeper', 'snyk-bot', 'mergify', 'vercel', 'netlify',
  'copilot', 'bugbot',
];

export function isBot(username: string): boolean {
  const lower = username.toLowerCase();
  return BOT_PATTERNS.some(p => lower.includes(p)) || lower.endsWith('[bot]');
}
