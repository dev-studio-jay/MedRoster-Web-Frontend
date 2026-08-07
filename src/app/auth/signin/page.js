'use client';

import { useState, Suspense } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '../../../lib/firebase';
import { apiFetch } from '../../../lib/api';

function SignInForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || null;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email.trim(), password);

            // Fetch the user's hospital to get hospitalId for redirect
            const hospitals = await apiFetch('/api/hospitals');
            const hid = hospitals?.[0]?._id;

            if (callbackUrl) {
                router.push(callbackUrl);
            } else if (hid) {
                router.push(`/hospital/${hid}`);
            } else {
                router.push('/');
            }
        } catch (err) {
            const code = err.code;
            if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
                setError('Invalid email or password. Please try again.');
            } else if (code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please wait a moment and try again.');
            } else {
                setError(err.message || 'Sign-in failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

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
                    <h2 className="text-xl font-extrabold text-ghs-deep mb-1">Sign in to your account</h2>
                    <p className="text-sm text-ghs-muted font-medium mb-7">
                        Don&apos;t have an account?{' '}
                        <Link href="/auth/register" className="text-ghs-teal font-bold hover:underline">
                            Register your hospital
                        </Link>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-ghs-muted uppercase tracking-widest ml-1">Email Address</label>
                            <input
                                type="email"
                                autoFocus
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-13 bg-ghs-surface border border-slate-100 rounded-2xl px-4 text-sm font-semibold text-ghs-deep placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-ghs-teal/10 focus:border-ghs-teal transition-all"
                                placeholder="you@hospital.gh"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-ghs-muted uppercase tracking-widest ml-1">Password</label>
                            <input
                                type="password"
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-13 bg-ghs-surface border border-slate-100 rounded-2xl px-4 text-sm font-semibold text-ghs-deep placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-ghs-teal/10 focus:border-ghs-teal transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs font-bold text-rose-600">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-13 bg-ghs-teal text-white rounded-2xl font-bold text-sm hover:bg-ghs-teal-hover shadow-lg shadow-ghs-teal/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-ghs-muted mt-6 font-medium">
                    <Link href="/" className="hover:text-ghs-teal transition-colors">← Back to home</Link>
                </p>
            </div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense>
            <SignInForm />
        </Suspense>
    );
}
