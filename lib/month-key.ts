const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

export function monthKeyFromJalaliDate(value: string): string | null {
  const normalized = toLatinDigits(value).trim();
  const match = normalized.match(/^(13\d{2}|14\d{2})[\/-](0?[1-9]|1[0-2])[\/-]\d{1,2}$/);
  if (!match) return null;
  return `${match[1]}-${match[2].padStart(2, "0")}`;
}
