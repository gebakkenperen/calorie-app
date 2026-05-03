export function getLocalDateKey(d = new Date()): string {
  // nl-BE yields YYYY-MM-DD in local time (Dutch locale)
  return new Intl.DateTimeFormat("nl-BE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(d);
}

export function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
}

