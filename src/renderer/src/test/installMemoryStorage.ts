function buildMemoryStorage(values: Map<string, string>): Storage {
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, value),
  };
}

export function installMemoryStorage(): Storage {
  const storage = buildMemoryStorage(new Map<string, string>());
  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
  return storage;
}
