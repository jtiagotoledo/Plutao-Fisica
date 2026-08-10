const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchWithAdmin(endpoint: string, options: RequestInit = {}) {
  const adminKey = typeof window !== 'undefined' ? localStorage.getItem('x-admin-key') : '';

  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(adminKey ? { 'x-admin-key': adminKey } : {}),
    ...options.headers,
  };

  const url = BASE_URL ? `${BASE_URL}${formattedEndpoint}` : `/api${formattedEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}