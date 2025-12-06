const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

let authToken = null;
let onUnauthorized = null;

const toUrl = (path, params) => {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.append(key, value);
    });
  }
  return url;
};

export async function apiRequest(
  path,
  { method = "GET", body, params, headers, signal } = {},
) {
  const url = toUrl(path, params);
  const requestHeaders =
    body instanceof FormData
      ? { ...(headers || {}) }
      : { ...DEFAULT_HEADERS, ...headers };

  if (authToken) {
    requestHeaders.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : null,
    signal,
  });

  if (response.status === 204) {
    return null;
  }

  if (response.status === 401 && typeof onUnauthorized === "function") {
    onUnauthorized();
  }

  const payload = await response
    .json()
    .catch(() => ({ success: response.ok }));

  if (!response.ok || payload?.success === false) {
    const message =
      payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload?.data ?? payload;
}

export const setAuthToken = (token) => {
  authToken = token || null;
};

export const clearAuthToken = () => {
  authToken = null;
};

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

export { API_BASE_URL };
