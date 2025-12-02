// Simple handoff helper for CRA frontend
// Detects ?code= in the URL, exchanges it via backend, stores nothing here
// Returns { success: boolean, user?: any, raw?: any }

export async function initHandoffLogin(baseApiUrl) {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) {
      return { success: false, reason: 'no_code' };
    }

    const apiBase = baseApiUrl || process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

    const res = await fetch(`${apiBase}/handoff/exchange?code=${encodeURIComponent(code)}` , {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Important if frontend and backend are on different origins
      credentials: 'include',
    });

    // Clean the URL to remove the code parameter regardless of success
    try {
      const { protocol, host, pathname, hash } = window.location;
      window.history.replaceState({}, document.title, `${protocol}//${host}${pathname}${hash}`);
    } catch (_) {
      // ignore history errors
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[handoff] exchange failed', res.status, text);
      return { success: false, status: res.status, error: text };
    }

    const data = await res.json().catch(() => ({}));
    console.log('[handoff] success', data);
    return { success: true, user: data?.user, raw: data };
  } catch (e) {
    console.error('[handoff] error', e);
    return { success: false, error: String(e) };
  }
}
