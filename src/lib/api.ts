export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

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

export async function fetchWithStudent(endpoint: string, options: RequestInit = {}) {
  const hash = typeof window !== 'undefined' ? localStorage.getItem('x-student-hash') : '';
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers = new Headers(options.headers || {});
  
  if (hash) {
    headers.set('x-student-hash', hash);
  }

  const url = BASE_URL ? `${BASE_URL}${formattedEndpoint}` : `/api${formattedEndpoint}`;

  return fetch(url, {
    ...options,
    headers,
  });
}