export function ensureString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value === undefined || value === null) {
    return fallback;
  }

  return String(value);
}

export function ensureNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}
