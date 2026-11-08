import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "../lib/api";

/** Loads data now and re-loads it every `ms` milliseconds. */
export function usePoll<T>(fetcher: () => Promise<T>, ms = 10_000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const latest = useRef(fetcher);
  latest.current = fetcher;

  const reload = useCallback(async () => {
    try { setData(await latest.current()); setError(""); }
    catch (e) { setError(errorMessage(e)); }
  }, []);

  useEffect(() => {
    void reload();
    const id = setInterval(() => void reload(), ms);
    return () => clearInterval(id);
  }, [reload, ms]);

  return { data, error, reload };
}
