export function parseStringArray(value: string | null | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

export function stringifyStringArray(value: string[] | string | undefined): string {
  if (!value) return "[]";
  if (Array.isArray(value)) return JSON.stringify(value.filter(Boolean));

  return JSON.stringify(
    value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}
