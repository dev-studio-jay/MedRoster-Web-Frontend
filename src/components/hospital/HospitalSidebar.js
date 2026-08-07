'use client';

import Link from 'next/link';

function normalizeName(value) {
    return String(value || '').trim().toLowerCase();
}

function getDisplayWards(department, wards) {
    const departmentWards = wards.filter((w) => String(w.departmentId) === String(department._id));
    const realWards = departmentWards.filter((ward) => normalizeName(ward.name) !== normalizeName(department.name));

    return realWards.length > 0 ? realWards : departmentWards;
}

export default function HospitalSidebar({ hospital, activeTab, onTabChange, tabs, isOpen, onToggle, onWardOpen }) {
    const departments = hospital.departments || [];
    const wards = hospital.wards || [];

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={onToggle}
                />
            )}

            <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:relative flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Link href="/" className="p-6 mb-2 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="w-10 h-10 bg-ghs-teal rounded-xl flex items-center justify-center text-white shadow-lg shadow-ghs-teal/20">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-base font-extrabold text-ghs-deep leading-tight">MedRoster</span>
                        <span className="text-[10px] font-bold text-ghs-muted uppercase tracking-wider">Dashboard</span>
                    </div>
                </Link>

                <div className="flex-1 overflow-y-auto px-4 space-y-8">
                    <div className="space-y-1">
                        <h4 className="px-4 mb-4">Manage</h4>
                        {tabs.map((t) => (
                            <button
                                key={t.id}
                                className={`w-full sidebar-item ${activeTab === t.id ? 'sidebar-item-active' : 'text-ghs-muted hover:bg-slate-50'}`}
                                onClick={() => onTabChange(t.id)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {departments.length > 0 && (
                        <div className="space-y-1">
                            <h4 className="px-4 mb-4">Wards by department</h4>
                            <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                                {departments.map((d) => {
                                    const departmentWards = getDisplayWards(d, wards);
                                    return (
                                        <div key={d._id} className="px-4 py-2 rounded-xl bg-slate-50/50">
                                            <div className="flex items-center gap-2 text-[12px] font-bold text-ghs-deep">
                                                <div className="w-2 h-2 rounded-full bg-ghs-teal/60" />
                                                <span className="flex-1 truncate">{d.name}</span>
                                            </div>
                                            {departmentWards.length > 0 && (
                                                <div className="mt-2 ml-4 space-y-1">
                                                    {departmentWards.map((ward) => (
                                                        <button
                                                            key={ward._id}
                                                            type="button"
                                                            onClick={() => onWardOpen?.(ward._id)}
                                                            className="block w-full text-left text-[10px] font-bold text-ghs-muted hover:text-ghs-teal truncate"
                                                        >
                                                            {ward.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-50">
                    <div className="p-3 bg-ghs-surface rounded-2xl">
                        <p className="text-xs font-bold text-ghs-deep truncate">{hospital.name}</p>
                        <p className="text-[10px] font-medium text-ghs-muted truncate">{hospital.type} · {hospital.region}</p>
                    </div>
                </div>
            </aside>
        </>
    );
}
