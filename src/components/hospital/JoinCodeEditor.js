'use client';

import { useState } from 'react';
import { apiFetch } from '../../lib/api';
import JoinCodeInput from '../auth/JoinCodeInput';

export default function JoinCodeEditor({ hospitalId, joinCode: initialCode, onUpdated }) {
    const [editing, setEditing] = useState(false);
    const [code, setCode] = useState(initialCode || '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const save = async () => {
        setBusy(true);
        setError('');
        setSuccess('');
        try {
            const data = await apiFetch(`/api/hospitals/${hospitalId}/join-code`, {
                method: 'PATCH',
                body: JSON.stringify({ newCode: code }),
            });
            setSuccess(`Saved as ${data.joinCode}`);
            setEditing(false);
            onUpdated?.(data.joinCode);
        } catch (err) {
            setError(err.message || 'Failed to update code');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-extrabold text-ghs-deep">Hospital join code</h3>
                    <p className="text-xs text-ghs-muted mt-1">Staff use this code to join and view schedules.</p>
                </div>
                {!editing && (
                    <button type="button" onClick={() => { setEditing(true); setCode(initialCode || ''); }} className="text-xs font-bold text-ghs-teal">
                        Edit
                    </button>
                )}
            </div>

            {!editing ? (
                <div className="mt-4 font-extrabold text-2xl tracking-[0.2em] text-ghs-deep">
                    {initialCode || '— — —'}
                </div>
            ) : (
                <div className="mt-4 space-y-3">
                    <JoinCodeInput value={code} onChange={setCode} />
                    {error && <div className="text-xs font-bold text-rose-600">{error}</div>}
                    {success && <div className="text-xs font-bold text-emerald-600">{success}</div>}
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setEditing(false)} className="h-10 px-4 rounded-xl border text-xs font-bold">Cancel</button>
                        <button type="button" disabled={busy} onClick={save} className="h-10 px-4 rounded-xl bg-ghs-teal text-white text-xs font-bold disabled:opacity-50">
                            {busy ? 'Saving…' : 'Save code'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
