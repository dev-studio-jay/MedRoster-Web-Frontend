'use client';

const RULE_GROUPS = [
    {
        title: 'Shifts',
        items: [
            'Morning is 8:00 AM to 2:00 PM.',
            'Afternoon is 2:00 PM to 8:00 PM.',
            'Night is 8:00 PM to 8:00 AM.',
        ],
    },
    {
        title: 'Leave and Holidays',
        items: [
            'Staff on general leave are removed from shifts completely.',
            'Study leave means no weekend shifts.',
            'Marked cycle holidays add to regular staff off-day targets.',
            'Incharge and assistant staff are off on weekday holidays.',
        ],
    },
    {
        title: 'Roles and Restrictions',
        items: [
            'Each ward can have one incharge and one assistant.',
            'Incharge and assistant work Monday to Friday, morning shifts only.',
            'At least one senior or in-charge on Morning each day — not afternoon or night.',
            'No night shift and maternity restrictions block night duty.',
            'Only morning, only afternoon, and weekday-only switches are hard rules.',
        ],
    },
    {
        title: 'Rest and Preferences',
        items: [
            'Regular staff target 12 off days in a 30/31-day cycle, plus marked holidays.',
            'Night shifts are capped at 3 by default; a fourth night is allowed only with a warning.',
            'Preferred off days and preferred shifts are not hard priority rules.',
            'Auto-generation applies core rules first, then tries preferences when requested.',
        ],
    },
];

export default function RulesModal({ onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-white rounded-[32px] overflow-hidden shadow-synclly-lg border border-slate-50 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                <div className="p-8 border-b border-slate-100 flex items-start justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-extrabold text-synclly-deep tracking-tight">Rules</h2>
                        <p className="text-sm font-medium text-synclly-muted mt-1">
                            Current scheduling rules, restrictions, and constraints used by the roster.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-synclly-surface text-synclly-muted hover:text-synclly-coral"
                    >
                        x
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[70vh] overflow-y-auto">
                    {RULE_GROUPS.map((group) => (
                        <section key={group.title} className="rounded-2xl bg-synclly-surface border border-slate-100 p-5">
                            <h3 className="text-sm font-extrabold text-synclly-deep mb-3">{group.title}</h3>
                            <ul className="space-y-2">
                                {group.items.map((item) => (
                                    <li key={item} className="text-xs font-medium text-synclly-muted leading-relaxed">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
