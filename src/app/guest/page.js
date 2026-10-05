'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    getGuestSchedule,
    saveGuestSchedule,
    getGuestExportsRemaining,
    consumeGuestExport,
    getGuestExportLimit,
} from '../../lib/guest-storage';
import ImportStaffModal from '../../components/modals/ImportStaffModal';
import { exportRosterPdf } from '../../lib/pdf-export';

function defaultMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        name: start.toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
    };
}

export default function GuestPage() {
    const defaults = useMemo(() => defaultMonthRange(), []);
    const [schedule, setSchedule] = useState(() => getGuestSchedule() || {
        ...defaults,
        staff: [],
        assignments: [],
        holidays: [],
        wardName: 'My Ward',
    });
    const [exportsLeft, setExportsLeft] = useState(getGuestExportsRemaining());
    const [showImport, setShowImport] = useState(false);
    const [newFirst, setNewFirst] = useState('');
    const [newLast, setNewLast] = useState('');
    const [newRank, setNewRank] = useState('Staff Nurse');
    const [banner, setBanner] = useState(true);

    useEffect(() => {
        saveGuestSchedule(schedule);
    }, [schedule]);

    const addStaff = () => {
        if (!newFirst.trim() || !newLast.trim()) return;
        if (schedule.staff.length >= 20) {
            alert('Guest mode is limited to 20 staff. Register to add more.');
            return;
        }
        setSchedule((s) => ({
            ...s,
            staff: [
                ...s.staff,
                {
                    _id: `g_${Date.now()}`,
                    firstName: newFirst.trim(),
                    lastName: newLast.trim(),
                    rank: newRank,
                },
            ],
        }));
        setNewFirst('');
        setNewLast('');
    };

    const removeStaff = (id) => {
        setSchedule((s) => ({
            ...s,
            staff: s.staff.filter((x) => x._id !== id),
            assignments: (s.assignments || []).filter((a) => a.staffId !== id),
        }));
    };

    const handleExport = async () => {
        if (exportsLeft <= 0) {
            alert('Guest export limit reached (5). Register for unlimited PDF exports.');
            return;
        }
        if (!consumeGuestExport()) {
            alert('Guest export limit reached.');
            return;
        }
        setExportsLeft(getGuestExportsRemaining());
        await exportRosterPdf({
            schedule: {
                startDate: schedule.startDate,
                endDate: schedule.endDate,
                holidays: schedule.holidays || [],
            },
            hospital: { name: 'Guest roster (not saved to cloud)' },
            ward: { name: schedule.wardName || 'WARD' },
            department: null,
            staff: schedule.staff,
            assignments: schedule.assignments || [],
        });
    };

    const daysInRange = useMemo(() => {
        const s = new Date(schedule.startDate);
        const e = new Date(schedule.endDate);
        return Math.round((e - s) / 86400000) + 1;
    }, [schedule.startDate, schedule.endDate]);

    return (
        <div className="min-h-screen bg-ghs-surface">
            {banner && (
                <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 text-sm text-amber-900 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                        Guest mode — data is saved only in this browser. Register to keep it permanently.
                    </span>
                    <div className="flex gap-2">
                        <Link href="/auth/register" className="px-3 py-1.5 rounded-lg bg-ghs-teal text-white text-xs font-bold">
                            Register to save
                        </Link>
                        <button type="button" onClick={() => setBanner(false)} className="text-xs font-bold text-amber-800">Dismiss</button>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <Link href="/" className="text-xs font-bold text-ghs-muted hover:text-ghs-teal">← Home</Link>
                        <h1 className="text-2xl font-extrabold text-ghs-deep mt-2">Guest roster</h1>
                        <p className="text-sm text-ghs-muted">
                            Max 1 month · {schedule.staff.length}/20 staff · {exportsLeft}/{getGuestExportLimit()} PDF exports left
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setShowImport(true)} className="h-11 px-4 rounded-xl border text-sm font-bold">
                            Import CSV
                        </button>
                        <button type="button" onClick={handleExport} className="h-11 px-4 rounded-xl bg-ghs-teal text-white text-sm font-bold">
                            Export PDF
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 p-6 mb-6 space-y-4">
                    <div className="grid sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-ghs-muted uppercase">Ward / title</label>
                            <input
                                className="w-full h-11 mt-1 rounded-xl border px-3 text-sm"
                                value={schedule.wardName || ''}
                                onChange={(e) => setSchedule((s) => ({ ...s, wardName: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-ghs-muted uppercase">Start</label>
                            <input
                                type="date"
                                className="w-full h-11 mt-1 rounded-xl border px-3 text-sm"
                                value={schedule.startDate}
                                onChange={(e) => setSchedule((s) => ({ ...s, startDate: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-ghs-muted uppercase">End ({daysInRange} days)</label>
                            <input
                                type="date"
                                className="w-full h-11 mt-1 rounded-xl border px-3 text-sm"
                                value={schedule.endDate}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    const days = Math.round((new Date(next) - new Date(schedule.startDate)) / 86400000) + 1;
                                    if (days > 31) {
                                        alert('Guest schedules are limited to 31 days.');
                                        return;
                                    }
                                    setSchedule((s) => ({ ...s, endDate: next }));
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 p-6">
                    <h2 className="font-extrabold text-ghs-deep mb-4">Staff</h2>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <input className="h-11 rounded-xl border px-3 text-sm" placeholder="First name" value={newFirst} onChange={(e) => setNewFirst(e.target.value)} />
                        <input className="h-11 rounded-xl border px-3 text-sm" placeholder="Last name" value={newLast} onChange={(e) => setNewLast(e.target.value)} />
                        <input className="h-11 rounded-xl border px-3 text-sm" placeholder="Rank" value={newRank} onChange={(e) => setNewRank(e.target.value)} />
                        <button type="button" onClick={addStaff} className="h-11 px-4 rounded-xl bg-ghs-teal text-white text-sm font-bold">Add</button>
                    </div>
                    <ul className="divide-y">
                        {schedule.staff.map((s) => (
                            <li key={s._id} className="py-3 flex items-center justify-between text-sm">
                                <span className="font-semibold text-ghs-deep">{s.firstName} {s.lastName} <span className="text-ghs-muted font-medium">· {s.rank}</span></span>
                                <button type="button" onClick={() => removeStaff(s._id)} className="text-xs font-bold text-rose-500">Remove</button>
                            </li>
                        ))}
                        {schedule.staff.length === 0 && (
                            <li className="py-8 text-center text-sm text-ghs-muted">No staff yet — add manually or import CSV.</li>
                        )}
                    </ul>
                    <p className="text-xs text-ghs-muted mt-4">
                        Tip: auto-generate and full calendar editing are available after you register (or use the hospital dashboard). Guest mode keeps your staff list ready to migrate.
                    </p>
                </div>
            </div>

            {showImport && (
                <ImportStaffModal
                    mode="guest"
                    onClose={() => setShowImport(false)}
                    onImported={(data) => {
                        if (data.staff?.length) {
                            setSchedule((s) => ({
                                ...s,
                                staff: [...s.staff, ...data.staff].slice(0, 20),
                            }));
                        }
                        setShowImport(false);
                    }}
                />
            )}
        </div>
    );
}
