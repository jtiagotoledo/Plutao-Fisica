const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function fetchWithAdmin(endpoint: string, options: RequestInit = {}) {
  const adminKey = typeof window !== 'undefined' ? localStorage.getItem('x-admin-key') : '';

  const headers = {
    'Content-Type': 'application/json',
    ...(adminKey ? { 'x-admin-key': adminKey } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}