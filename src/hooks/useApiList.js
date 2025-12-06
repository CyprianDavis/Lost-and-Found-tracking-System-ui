import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

export function useApiList(path, initialParams = {}) {
  const [data, setData] = useState([]);
  const [params, setParams] = useState(initialParams);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (overrideParams = {}) => {
      setLoading(true);
      setError(null);
      try {
        const mergedParams = { ...params, ...overrideParams };
        const response = await apiRequest(path, { params: mergedParams });
        setData(Array.isArray(response) ? response : response ? [response] : []);
        return response;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [params, path],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    params,
    setParams,
    loading,
    error,
    refetch: fetchData,
  };
}
