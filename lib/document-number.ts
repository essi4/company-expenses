const COUNTER_KEY = "company-expenses:invoice-counter";

export function generateDocumentNumber(year: number, sequence: number, prefix = "ASL"): string {
  return `${prefix}-${year}-${String(Math.max(1, Math.trunc(sequence))).padStart(3, "0")}`;
}

export function nextTemporarySequence(year: number, prefix = "ASL"): number {
  if (typeof window === "undefined") return 1;

  const key = `${COUNTER_KEY}:${prefix}:${year}`;
  const current = Number(window.localStorage.getItem(key) || "82");
  const next = Number.isFinite(current) && current > 0 ? current + 1 : 1;
  window.localStorage.setItem(key, String(next));
  return next;
}
