export function parseLocaleNumberInput(raw: string, fallback = 0) {
  const clean = raw.trim().replace(/\s/g, "");
  if (!clean) return fallback;

  const normalized = clean.includes(",")
    ? clean.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(clean)
      ? clean.replace(/\./g, "")
      : clean;

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function displayNumberInput(value: number | null | undefined, blankZero = true) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  if (blankZero && numeric === 0) return "";
  return String(numeric);
}
