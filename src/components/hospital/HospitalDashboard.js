'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import HospitalSidebar from './HospitalSidebar';
import DepartmentsTab from './DepartmentsTab';
import StaffTab from './StaffTab';
import SchedulesTab from './SchedulesTab';

const TABS = [
    { id: 'departments', label: 'Wards' },
    { id: 'staff', label: 'Staff' },
    { id: 'schedules', label: 'Schedules' },
];

export default function HospitalDashboard({ hospitalId }) {
    const router = useRouter();
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('departments');
    const [activeWardId, setActiveWardId] = useState('all');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const fetchHospital = useCallback(async () => {
        try {
            const data = await apiFetch(`/api/hospitals/${hospitalId}`);
            if (!data.departments || data.departments.length === 0) {
                router.replace(`/hospital/${hospitalId}/setup`);
                return;
            }
            setHospital(data);
        } catch {
            router.push('/');
        } finally {
            setLoading(false);
        }
    }, [hospitalId, router]);

    useEffect(() => {
        fetchHospital();
    }, [fetchHospital]);

    const openWard = (wardId) => {
        setActiveWardId(wardId);
        setActiveTab('staff');
        setSidebarOpen(false);
    };

    if (loading || !hospital) {
        return (
            <div className="flex items-center justify-center h-screen bg-ghs-surface">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-ghs-teal rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-ghs-surface overflow-hidden text-ghs-deep">
            <HospitalSidebar
                hospital={hospital}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onWardOpen={openWard}
                tabs={TABS}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {/* Mobile top bar */}
                <div className="md:hidden flex items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="w-9 h-9 rounded-xl bg-ghs-surface flex items-center justify-center text-ghs-muted"
                        aria-label="Open menu"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                    </button>
                    <span className="text-sm font-extrabold text-ghs-deep">{hospital.name}</span>
                    <div className="w-9" />
                </div>

                <header className="px-6 md:px-10 pt-8 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-ghs-muted uppercase tracking-widest">
                            {hospital.type} · {hospital.region}
                        </p>
                        <h1>{hospital.name}</h1>
                    </div>

                    <div className="h-10 bg-white border border-slate-200 rounded-2xl flex p-1 shadow-synclly overflow-hidden">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`px-4 text-[11px] font-bold rounded-xl transition-all ${
                                    activeTab === t.id
                                        ? 'bg-ghs-teal-light text-ghs-teal'
                                        : 'text-ghs-muted hover:text-ghs-deep'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </header>

                <main className="px-6 md:px-10 pb-20 flex-1 flex flex-col min-h-0">
                    {activeTab === 'departments' && (
                        <DepartmentsTab hospital={hospital} onChange={fetchHospital} onWardOpen={openWard} />
                    )}
                    {activeTab === 'staff' && (
                        <StaffTab
                            hospital={hospital}
                            onChange={fetchHospital}
                            activeWardId={activeWardId}
                            onWardChange={setActiveWardId}
                        />
                    )}
                    {activeTab === 'schedules' && (
                        <SchedulesTab hospital={hospital} />
                    )}
                </main>
            </div>
        </div>
    );
}
