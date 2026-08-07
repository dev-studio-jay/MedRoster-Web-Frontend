'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HOSPITAL_TYPES, GHANA_REGIONS } from '../../../lib/ghana-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function RegisterPage() {
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [hospitalName, setHospitalName] = useState('');
    const [hospitalType, setHospitalType] = useState('District Hospital');
    const [hospitalRegion, setHospitalRegion] = useState('Greater Accra');
    const [hospitalLocation, setHospitalLocation] = useState('');

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleStep1 = (e) => {
        e.preventDefault();
        if (!hospitalName.trim()) return;
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    hospitalName,
                    hospitalType,
                    hospitalRegion,
                    hospitalLocation: hospitalLocation.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Registration failed'); return; }
            router.push('/auth/signin?registered=1');
        } catch (err) {
            setError(err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const inputCls =
        'w-full h-13 bg-ghs-surface border border-slate-100 rounded-2xl px-4 text-sm font-semibold text-ghs-deep placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-ghs-teal/10 focus:border-ghs-teal transition-all';

    return (
        <div className="min-h-screen bg-ghs-surface flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-ghs-teal rounded-[20px] mb-5 shadow-lg shadow-ghs-teal/25">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-ghs-deep tracking-tight">MedRoster</h1>
                    <p className="text-ghs-muted font-medium mt-1 text-sm">Ghana Hospital Staff Scheduling</p>
                </div>

                <div className="bg-white rounded-[32px] shadow-synclly border border-slate-100 p-8">
                    <div className="flex items-center gap-3 mb-7">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${step >= 1 ? 'bg-ghs-teal text-white' : 'bg-slate-100 text-slate-400'}`}>1</div>
                        <div className={`flex-1 h-0.5 rounded ${step >= 2 ? 'bg-ghs-teal' : 'bg-slate-100'}`} />
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${step >= 2 ? 'bg-ghs-teal text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
                    </div>

                    {step === 1 ? (
                        <>
                            <h2 className="text-xl font-extrabold text-ghs-deep mb-1">Your hospital details</h2>
                            <p className="text-sm text-ghs-muted font-medium mb-7">
                                Already registered?{' '}
                                <Link href="/auth/signin" className="text-ghs-teal font-bold hover:underline">Sign in</Link>
                            </p>
                            <form onSubmit={handleStep1} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-ghs-muted uppercase tracking-widest ml-1">Hospital Name</label>
                                    <input autoFocus required className={inputCls} placeholder="e.g. Korle Bu Teaching Hospital"
                                        value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-ghs-muted uppercase tracking-widest ml-1">Type</label>
                                        <select value={hospitalType} onChange={(e) => setHospitalType(e.target.value)}
                                            className={inputCls + ' appearance-none cursor-pointer'}>
                                            {HOSPITAL_TYPES.map((t) => <option key={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-ghs-muted uppercase tracking-widest ml-1">Region</label>
                                        <select value={hospitalRegion} onChange={(e) => setHospitalRegion(e.target.value)}
                                            className={inputCls + ' appearance-none cursor-pointer'}>
                                            {GHANA_REGIONS.map((r) => <option key={r}>{r}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-ghs-muted uppercase tracking-widest ml-1">City / Town (optional)</label>
                                    <input className={inputCls} placeholder="e.g. Accra"
                                        value={hospitalLocation} onChange={(e) => setHospitalLocation(e.target.value)} />
                                </div>
                                <button type="submit"
                                    className="w-full h-13 bg-ghs-teal text-white rounded-2xl font-bold text-sm hover:bg-ghs-teal-hover shadow-lg shadow-ghs-teal/20 transition-all active:scale-95 mt-2">
                                    Continue →
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <h2 className="text-xl font-extrabold text-ghs-deep mb-1">Create admin account</h2>
                            <p className="text-sm text-ghs-muted font-medium mb-7">
                                For <span className="font-bold text-ghs-deep">{hospitalName}</span>
                            </p>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-ghs-muted uppercase tracking-widest ml-1">Your Name</label>
                                    <input type="text" required autoFocus className={inputCls} placeholder="e.g. Dr. Kwame Mensah"
                                        value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-ghs-muted uppercase tracking-widest ml-1">Email Address</label>
                                    <input type="email" required autoComplete="email" className={inputCls} placeholder="you@hospital.gh"
                                        value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-ghs-muted uppercase tracking-widest ml-1">Password</label>
                                    <input type="password" required autoComplete="new-password" className={inputCls} placeholder="Minimum 8 characters"
                                        value={password} onChange={(e) => setPassword(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-ghs-muted uppercase tracking-widest ml-1">Confirm Password</label>
                                    <input type="password" required autoComplete="new-password" className={inputCls} placeholder="Repeat password"
                                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                </div>
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs font-bold text-rose-600">{error}</div>
                                )}
                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={() => setStep(1)}
                                        className="h-13 px-6 rounded-2xl bg-white border border-slate-200 text-ghs-muted font-bold text-sm hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                                        ← Back
                                    </button>
                                    <button type="submit" disabled={loading}
                                        className="flex-1 h-13 bg-ghs-teal text-white rounded-2xl font-bold text-sm hover:bg-ghs-teal-hover shadow-lg shadow-ghs-teal/20 transition-all active:scale-95 disabled:opacity-50">
                                        {loading ? 'Creating account…' : 'Create Account'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>

                <p className="text-center text-xs text-ghs-muted mt-6 font-medium">
                    <Link href="/" className="hover:text-ghs-teal transition-colors">← Back to home</Link>
                </p>
            </div>
        </div>
    );
}
