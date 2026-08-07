import { auth } from './firebase';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function apiFetch(path, options = {}) {
    let token = null;
    try {
        // Force-refresh ensures we always have a valid, non-expired token
        token = await auth.currentUser?.getIdToken(false);
    } catch {
        // Not signed in — request will be sent without auth header
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = new Error(body.error || res.statusText || 'Request failed');
        err.status = res.status;
        err.data = body;
        throw err;
    }

    return res.json();
}
