/**
 * Light formatting helpers — no date-fns dependency on purpose.
 */

export function formatDistanceToNow(input: string | Date): string {
  const then = typeof input === "string" ? new Date(input) : input;
  const now = new Date();
  const diff = now.getTime() - then.getTime();
  const sec = Math.max(0, Math.round(diff / 1000));
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  if (day < 30) return `${Math.round(day / 7)} week${Math.round(day / 7) === 1 ? "" : "s"} ago`;
  if (day < 365) return `${Math.round(day / 30)} mo ago`;
  return `${Math.round(day / 365)}y ago`;
}

export function formatDateShort(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDateLong(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
