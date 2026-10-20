import { useCallback, useEffect, useRef, useState } from "react";
export interface Resource<T> {
  data: T | undefined;
  error: string;
  loading: boolean;
  reload: () => void;
}
export const useResource = <T>(
  loader: () => Promise<T>,
  key: string,
): Resource<T> => {
  const [data, setData] = useState<T>(),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  const latest = useRef(loader);
  latest.current = loader;
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    void latest
      .current()
      .then((v) => {
        if (alive) setData(v);
      })
      .catch((e: unknown) => {
        if (alive)
          setError(e instanceof Error ? e.message : "연결에 실패했어요.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [key, revision]);
  const reload = useCallback((): void => setRevision((v) => v + 1), []);
  return { data, error, loading, reload };
};
