import { auth } from './firebase';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function apiFetch(path, options = {}, { retryOnAuth = true } = {}) {
    let token = null;
    try {
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

    if (res.status === 401 && retryOnAuth && auth.currentUser) {
        try {
            token = await auth.currentUser.getIdToken(true);
            const retry = await fetch(`${BASE_URL}${path}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    ...options.headers,
                },
            });
            if (retry.ok) return retry.json();
            const body = await retry.json().catch(() => ({}));
            const err = new Error(body.error || retry.statusText || 'Request failed');
            err.status = retry.status;
            err.data = body;
            throw err;
        } catch (err) {
            if (err.status) throw err;
        }
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = new Error(body.error || res.statusText || 'Request failed');
        err.status = res.status;
        err.data = body;
        throw err;
    }

    return res.json();
}
