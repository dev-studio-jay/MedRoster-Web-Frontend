'use client';

import { useMemo, useState } from 'react';

export default function JoinCodeInput({ value, onChange, placeholder = 'KBU-X7F' }) {
    const display = useMemo(() => {
        const raw = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9);
        if (raw.length <= 3) return raw;
        if (raw.length <= 6) return `${raw.slice(0, 3)}-${raw.slice(3)}`;
        return raw;
    }, [value]);

    return (
        <input
            type="text"
            value={display}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
            className="w-full h-13 bg-ghs-surface border border-slate-100 rounded-2xl px-4 text-sm font-bold tracking-[0.2em] text-ghs-deep placeholder:text-slate-300 placeholder:tracking-normal focus:outline-none focus:ring-4 focus:ring-ghs-teal/10 focus:border-ghs-teal transition-all uppercase"
        />
    );
}

export function formatJoinCodeInput(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
}
