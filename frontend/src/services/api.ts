// Native fetch wrapper for API queries
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Include credentials for HTTP-only cookies
  options.credentials = 'include';
  options.headers = headers;

  const response = await fetch(`${BASE_URL}${path}`, options);

  if (response.status === 401 && !path.includes('/auth/login')) {
    // Session expired or unauthorized, trigger redirect to login if appropriate
    if (typeof window !== 'undefined') {
      // Avoid redirect loops during active operations
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        window.location.href = '/login';
      }
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

export const api = {
  get: (path: string, options?: RequestInit) => request(path, { ...options, method: 'GET' }),
  post: (path: string, body: any, options?: RequestInit) =>
    request(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: (path: string, body: any, options?: RequestInit) =>
    request(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string, options?: RequestInit) => request(path, { ...options, method: 'DELETE' }),
};
