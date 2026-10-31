type ClassValue = string | number | false | null | undefined | ClassValue[] | Record<string, unknown>;

function collectClasses(value: ClassValue, result: string[]) {
  if (!value) return;
  if (typeof value === "string" || typeof value === "number") {
    result.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectClasses(item, result));
    return;
  }
  for (const [name, enabled] of Object.entries(value)) if (enabled) result.push(name);
}

/** Small dependency-free class combiner used by the supplied UI components. */
export function cn(...values: ClassValue[]) {
  const classes: string[] = [];
  values.forEach((value) => collectClasses(value, classes));
  return classes.join(" ");
}
