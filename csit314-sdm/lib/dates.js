// Small date helpers shared by entities and controllers (not a B-C-E class).
// Dates in the app are "YYYY-MM-DD" strings in the user's local time (Singapore time on our PCs).

// "2026-10-10T04:00:00.000Z" -> "2026-10-10" (the local calendar day of that moment)
export function toDateKey(isoTimestamp) {
  const d = new Date(isoTimestamp);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

// True if the timestamp falls on startDate, endDate, or any day in between.
export function isWithinDates(isoTimestamp, startDate, endDate) {
  const day = toDateKey(isoTimestamp);
  return day >= startDate && day <= endDate; // "YYYY-MM-DD" strings sort like dates
}

// True if a timestamp falls within either bound, inclusive. Bounds may be date keys or Dates.
export function isWithinDateRange(timestamp, startDate, endDate) {
  if (!timestamp) return false;
  const day = toDateKey(timestamp);
  const startKey =
    startDate == null
      ? null
      : typeof startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(startDate)
        ? startDate
        : toDateKey(startDate);
  const endKey =
    endDate == null
      ? null
      : typeof endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(endDate)
        ? endDate
        : toDateKey(endDate);
  return (!startKey || day >= startKey) && (!endKey || day <= endKey);
}

// True for a real "YYYY-MM-DD" date, e.g. not "" or "2026-02-31".
export function isValidDateKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey ?? "")) return false;
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

// Every day from startDate to endDate, both included: ["2026-10-10", "2026-10-11", ...]
export function daysBetween(startDate, endDate) {
  const days = [];
  const [y, m, d] = startDate.split("-").map(Number);
  const current = new Date(y, m - 1, d);
  while (toDateKey(current.toISOString()) <= endDate) {
    days.push(toDateKey(current.toISOString()));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

// Today, or N days before today, as "YYYY-MM-DD".
export function daysAgo(n) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return toDateKey(date.toISOString());
}
