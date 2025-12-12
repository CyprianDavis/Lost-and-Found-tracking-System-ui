import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

export function useApiList(path, initialParams = {}, options = {}) {
  const { enabled = true } = options;

  const [data, setData] = useState([]);
  const [page, setPage] = useState(null);
  const [params, setParams] = useState(initialParams);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (overrideParams = {}) => {
      if (!enabled || !path) {
        setData([]);
        setPage(null);
        return [];
      }
      setLoading(true);
      setError(null);
      try {
        const mergedParams = { ...params, ...overrideParams };
        const response = await apiRequest(path, { params: mergedParams });
        const content = Array.isArray(response?.content)
          ? response.content
          : Array.isArray(response)
            ? response
            : response
              ? [response]
              : [];
        setData(content);
        setPage(Array.isArray(response?.content) ? response : null);
        return response;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [enabled, params, path],
  );

  useEffect(() => {
    if (!enabled || !path) {
      setData([]);
      setPage(null);
      setLoading(false);
      return;
    }
    fetchData();
  }, [enabled, fetchData, path]);

  return {
    data,
    page,
    params,
    setParams,
    loading,
    error,
    refetch: fetchData,
  };
}
