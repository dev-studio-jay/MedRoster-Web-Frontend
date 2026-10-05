'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import StaffFormModal from '../modals/StaffFormModal';
import ImportStaffModal from '../modals/ImportStaffModal';
import { useFirebaseAuth } from '../FirebaseAuthProvider';

function currentMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        label: start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    };
}

function formatRange(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export default function WardHome({ hospital, ward, department, onChange }) {
    const { role } = useFirebaseAuth();
    const router = useRouter();
    const canWrite = role !== 'staff';
    const [staff, setStaff] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyRoster, setBusyRoster] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [editStaff, setEditStaff] = useState(null);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');

    const departments = useMemo(() => hospital.departments || [], [hospital.departments]);
    const wards = useMemo(() => hospital.wards || [], [hospital.wards]);

    const load = useCallback(async () => {
        try {
            const [staffData, schedData] = await Promise.all([
                apiFetch(`/api/hospitals/${hospital._id}/staff`),
                apiFetch(`/api/hospitals/${hospital._id}/schedules`),
            ]);
            setStaff(Array.isArray(staffData) ? staffData : []);
            setSchedules(Array.isArray(schedData) ? schedData : []);
        } catch {
            setStaff([]);
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    }, [hospital._id]);

    useEffect(() => {
        setLoading(true);
        load();
    }, [load, ward._id]);

    const refresh = async () => {
        await load();
        onChange?.();
    };

    const wardStaff = useMemo(() => {
        const q = search.trim().toLowerCase();
        return staff.filter((s) => {
            if (String(s.wardId) !== String(ward._id)) return false;
            if (!q) return true;
            return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || (s.rank || '').toLowerCase().includes(q);
        });
    }, [staff, ward._id, search]);

    const wardSchedules = useMemo(
        () => schedules
            .filter((s) => String(s.wardId) === String(ward._id))
            .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate))),
        [schedules, ward._id]
    );

    const latestSchedule = wardSchedules[0] || null;

    const openSchedule = (scheduleId) => {
        router.push(`/hospital/${hospital._id}/schedule/${scheduleId}`);
    };

    const makeThisMonth = async () => {
        setBusyRoster(true);
        setError('');
        try {
            const range = currentMonthRange();
            const data = await apiFetch(`/api/hospitals/${hospital._id}/schedules`, {
                method: 'POST',
                body: JSON.stringify({
                    wardId: ward._id,
                    startDate: range.startDate,
                    endDate: range.endDate,
                    name: `${ward.name} · ${range.label}`,
                }),
            });
            openSchedule(data._id);
        } catch (err) {
            if (err.status === 409 && err.data?.scheduleId) {
                openSchedule(err.data.scheduleId);
                return;
            }
            setError(err.message || 'Could not create this month’s roster');
        } finally {
            setBusyRoster(false);
        }
    };

    const handleSaved = async () => {
        setShowAdd(false);
        setEditStaff(null);
        await refresh();
    };

    const handleDelete = async (s) => {
        if (!confirm(`Remove ${s.firstName} ${s.lastName}? Their assignments will also be deleted.`)) return;
        try {
            await apiFetch(`/api/hospitals/${hospital._id}/staff/${s._id}`, { method: 'DELETE' });
            await refresh();
        } catch (err) {
            alert(err.message || 'Failed to delete');
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold text-ghs-muted uppercase tracking-widest">
                        {department?.name || 'Department'}
                    </p>
                    <h2 className="text-2xl font-extrabold tracking-tight">{ward.name}</h2>
                    <p className="text-synclly-muted font-medium text-sm mt-1">
                        {wardStaff.length} {wardStaff.length === 1 ? 'staff member' : 'staff'} on this ward.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {latestSchedule ? (
                        <button
                            onClick={() => openSchedule(latestSchedule._id)}
                            className="btn btn-primary text-xs py-2"
                        >
                            Open roster
                        </button>
                    ) : canWrite ? (
                        <button
                            onClick={makeThisMonth}
                            disabled={busyRoster}
                            className="btn btn-primary text-xs py-2 disabled:opacity-50"
                        >
                            {busyRoster ? 'Creating…' : 'Make this month’s roster'}
                        </button>
                    ) : null}
                    {canWrite && (
                        <>
                            <button onClick={() => setShowImport(true)} className="btn btn-secondary text-xs py-2">
                                Import roster
                            </button>
                            <button onClick={() => setShowAdd(true)} className="btn btn-secondary text-xs py-2">
                                Add staff
                            </button>
                        </>
                    )}
                </div>
            </div>

            {latestSchedule && (
                <p className="text-xs font-medium text-synclly-muted">
                    Current cycle: {formatRange(latestSchedule.startDate, latestSchedule.endDate)}
                    {latestSchedule.assignmentCount != null ? ` · ${latestSchedule.assignmentCount} shifts` : ''}
                </p>
            )}

            {error && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 text-xs font-bold text-rose-600">{error}</div>
            )}

            <div className="flex gap-2">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or rank..."
                    className="h-10 w-64 bg-white border border-slate-200 rounded-xl px-4 text-sm font-medium text-synclly-deep placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-synclly-coral/5 focus:border-synclly-coral"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-synclly-coral rounded-full animate-spin" />
                </div>
            ) : wardStaff.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[40px] border border-slate-100 shadow-synclly">
                    <h3 className="text-xl font-extrabold text-synclly-deep">No one on this ward yet</h3>
                    <p className="text-synclly-muted text-sm font-medium max-w-xs mt-2 mb-6">
                        {canWrite
                            ? 'Import a duty roster or add staff, then open the calendar to edit shifts.'
                            : 'No staff have been assigned to this ward.'}
                    </p>
                    {canWrite && (
                        <div className="flex gap-2">
                            <button onClick={() => setShowImport(true)} className="btn btn-secondary text-xs py-2">Import roster</button>
                            <button onClick={() => setShowAdd(true)} className="btn btn-primary text-xs py-2">Add staff</button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {wardStaff.map((s) => {
                        const initials = `${s.firstName?.[0] || ''}${s.lastName?.[0] || ''}`.toUpperCase();
                        const badge =
                            s.staffType === 'pno'
                                ? { label: 'PNO+', cls: 'bg-purple-50 text-purple-600 border-purple-100' }
                                : s.staffType === 'senior'
                                ? { label: 'SENIOR', cls: 'bg-blue-50 text-blue-600 border-blue-100' }
                                : null;
                        return (
                            <div key={s._id} className="group bg-white rounded-[24px] border border-slate-50 p-6 transition-all hover:shadow-synclly hover:-translate-y-0.5">
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 rounded-2xl bg-synclly-coral/10 text-synclly-coral flex items-center justify-center font-extrabold text-sm shrink-0">
                                            {initials}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-base font-extrabold text-synclly-deep truncate">{s.firstName} {s.lastName}</h3>
                                            <p className="text-[11px] font-bold text-synclly-muted uppercase tracking-wider truncate">
                                                {s.rank || s.category || 'Staff'}
                                            </p>
                                        </div>
                                    </div>
                                    {badge && (
                                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-md border ${badge.cls}`}>
                                            {badge.label}
                                        </span>
                                    )}
                                </div>
                                {canWrite && (
                                    <div className="flex gap-2 pt-4 border-t border-slate-50">
                                        <button
                                            onClick={() => setEditStaff(s)}
                                            className="flex-1 h-9 rounded-xl bg-synclly-surface text-synclly-deep text-[11px] font-bold hover:bg-slate-100"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(s)}
                                            className="w-9 h-9 rounded-xl text-rose-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center"
                                            title="Remove"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {(showAdd || editStaff) && (
                <StaffFormModal
                    hospitalId={hospital._id}
                    departments={departments}
                    wards={wards}
                    staff={editStaff}
                    defaultDepartmentId={ward.departmentId || departments[0]?._id}
                    defaultWardId={ward._id}
                    onClose={() => {
                        setShowAdd(false);
                        setEditStaff(null);
                    }}
                    onSaved={handleSaved}
                />
            )}

            {showImport && (
                <ImportStaffModal
                    mode="hospital"
                    hospitalId={hospital._id}
                    departments={departments}
                    wards={wards}
                    defaultDepartmentId={ward.departmentId}
                    defaultWardId={ward._id}
                    lockWard
                    onClose={async () => {
                        setShowImport(false);
                        await refresh();
                    }}
                    onImported={async (data) => {
                        await refresh();
                        if (data?.stayOnWard || !data?.scheduleId) {
                            setShowImport(false);
                            return;
                        }
                        if (data?.openRoster && data.scheduleId) {
                            setShowImport(false);
                            openSchedule(data.scheduleId);
                        }
                    }}
                />
            )}
        </div>
    );
}
