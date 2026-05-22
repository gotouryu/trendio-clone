"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Type-safe localStorage hook with SSR safety.
 * Returns [value, setValue, isHydrated].
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (v: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValueState] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValueState(JSON.parse(raw) as T);
      }
    } catch {
      // ignore parse error, keep initialValue
    } finally {
      setHydrated(true);
    }
  }, [key]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValueState((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // quota exceeded or private mode, ignore
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, setValue, hydrated];
}
