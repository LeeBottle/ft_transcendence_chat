type SelectMap<T extends object> = Partial<Record<keyof T, true>>;

export function buildUserEntitySelectMap<T extends object>(
  keys: readonly (keyof T)[] = [],
): SelectMap<T> {
  const selectMap: SelectMap<T> = {};

  for (const key of keys) {
    selectMap[key] = true;
  }

  return selectMap;
}
