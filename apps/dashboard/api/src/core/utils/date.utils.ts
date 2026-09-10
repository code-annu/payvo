export function stringToDateNullable(str?: string | null) {
  return str ? new Date(str) : null;
}

export function stringToDate(str: string) {
  return new Date(str);
}

