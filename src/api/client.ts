const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function apiFetch(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<Response> {
  const { token, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(`${API_URL}${path}`, { ...init, headers, credentials: 'include' });
}
