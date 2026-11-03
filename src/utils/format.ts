const pad = (n: number) => String(n).padStart(2, "0");

/** Today's date in local time as YYYY-MM-DD */
export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Current month as YYYY-MM */
export const currentMonth = () => todayStr().slice(0, 7);

export function formatTime(v: string | null | undefined): string {
  if (!v) return "-";
  if (/^\d{1,2}:\d{2}/.test(v)) return v.slice(0, 5);
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(v: string | null | undefined): string {
  if (!v) return "-";
  const d = new Date(v.length === 10 ? `${v}T00:00:00` : v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(v: string | null | undefined): string {
  if (!v) return "-";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return `${formatDate(v)}, ${formatTime(v)}`;
}

export function formatMinutes(m: number | null | undefined): string {
  if (!m || m <= 0) return "-";
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function formatMoney(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Inclusive number of days between two YYYY-MM-DD dates. */
export function daysBetween(start: string, end: string): number {
  const s = new Date(`${start}T00:00:00`).getTime();
  const e = new Date(`${end}T00:00:00`).getTime();
  if (isNaN(s) || isNaN(e) || e < s) return 0;
  return Math.round((e - s) / 86400000) + 1;
}

export function monthLabel(m: string): string {
  const d = new Date(`${m}-01T00:00:00`);
  if (isNaN(d.getTime())) return m;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
}
