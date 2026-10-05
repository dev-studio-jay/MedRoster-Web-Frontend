'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { exportRosterPdf } from '../../../lib/pdf-export';
import { useFirebaseAuth } from '../../../components/FirebaseAuthProvider';

export default function IndividualSchedulePage() {
    const { schedId } = useParams();
    const router = useRouter();
    const { status } = useFirebaseAuth();
    const [schedule, setSchedule] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/auth/signin');
        if (status !== 'authenticated') return;
        apiFetch(`/api/me/schedules/${schedId}`)
            .then(setSchedule)
            .catch((e) => setError(e.message));
    }, [status, schedId, router]);

    if (!schedule && !error) {
        return <div className="min-h-screen flex items-center justify-center text-ghs-muted">Loading…</div>;
    }

    return (
        <div className="min-h-screen bg-ghs-surface">
            <div className="max-w-4xl mx-auto px-6 py-8">
                <Link href="/individual" className="text-xs font-bold text-ghs-muted">← Back</Link>
                {error && <div className="mt-4 text-rose-600 text-sm font-bold">{error}</div>}
                {schedule && (
                    <>
                        <div className="flex items-center justify-between mt-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-extrabold text-ghs-deep">{schedule.name}</h1>
                                <p className="text-sm text-ghs-muted">{schedule.startDate} → {schedule.endDate}</p>
                            </div>
                            <button
                                type="button"
                                className="h-11 px-4 rounded-xl bg-ghs-teal text-white text-sm font-bold"
                                onClick={() => exportRosterPdf({
                                    schedule,
                                    hospital: { name: 'Individual account' },
                                    ward: { name: 'Roster' },
                                    staff: schedule.staff || [],
                                    assignments: schedule.assignments || [],
                                })}
                            >
                                Export PDF
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl border p-5">
                            <h2 className="font-extrabold mb-3">Staff ({(schedule.staff || []).length})</h2>
                            <ul className="divide-y text-sm">
                                {(schedule.staff || []).map((s, i) => (
                                    <li key={s._id || i} className="py-2 font-semibold">
                                        {s.firstName} {s.lastName} <span className="text-ghs-muted font-medium">· {s.rank}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-ghs-muted mt-4">
                                Full calendar assignment UI for individual schedules can use the hospital schedule editor after upgrade, or edit staff via Import CSV on the dashboard.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
