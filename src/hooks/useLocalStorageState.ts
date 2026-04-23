import { useCallback, useEffect, useState } from 'react';

type UseLocalStorageStateOptions<T> = {
  serialize: (value: T) => string;
  deserialize: (raw: string) => T;
};

const LOCAL_STORAGE_EVENT = 'mahjong:local-storage';

export function useLocalStorageState<T>(
  key: string,
  getInitialValue: () => T,
  options: UseLocalStorageStateOptions<T>
): readonly [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return getInitialValue();
    try {
      const raw = window.localStorage.getItem(key);
      return raw == null ? getInitialValue() : options.deserialize(raw);
    } catch {
      return getInitialValue();
    }
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== window.localStorage) return;
      if (e.key !== key) return;
      try {
        const raw = e.newValue;
        setValue(raw == null ? getInitialValue() : options.deserialize(raw));
      } catch {
        // Ignore malformed values or transient access errors.
      }
    };

    const onCustom = (e: Event) => {
      const ce = e as CustomEvent<{ key: string; raw: string | null }>;
      if (!ce.detail || ce.detail.key !== key) return;
      try {
        const raw = ce.detail.raw;
        setValue(raw == null ? getInitialValue() : options.deserialize(raw));
      } catch {
        // Ignore malformed values or transient access errors.
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(LOCAL_STORAGE_EVENT, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(LOCAL_STORAGE_EVENT, onCustom);
    };
  }, [key, getInitialValue, options]);

  const write = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          const raw = options.serialize(resolved);
          window.localStorage.setItem(key, raw);
          window.dispatchEvent(new CustomEvent(LOCAL_STORAGE_EVENT, { detail: { key, raw } }));
        } catch {
          // Ignore write failures (e.g. private mode, quota exceeded).
        }
        return resolved;
      });
    },
    [key, options]
  );

  return [value, write] as const;
}

