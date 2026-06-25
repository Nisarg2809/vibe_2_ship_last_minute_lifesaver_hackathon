export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const geminiApiKey = localStorage.getItem('gemini_api_key');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (geminiApiKey) {
    headers['x-gemini-api-key'] = geminiApiKey;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errText = await response.text();
    let parsedErr = 'Request failed';
    try {
      parsedErr = JSON.parse(errText).error || parsedErr;
    } catch {
      parsedErr = errText || parsedErr;
    }
    throw new Error(parsedErr);
  }

  return response.json();
}
