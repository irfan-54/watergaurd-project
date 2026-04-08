export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

import { supabase } from '../lib/supabase';

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    let authHeader = {};
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.access_token) {
        authHeader = { Authorization: `Bearer ${sessionData.session.access_token}` };
      }
    } catch (e) {}

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "ngrok-skip-browser-warning": "true",
        ...authHeader,
        ...(options.headers || {})
      }
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type");

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `API error: ${response.status}`);
    }

    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    return response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    
    throw error;
  }
}