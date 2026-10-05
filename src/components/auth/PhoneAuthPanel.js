'use client';

import { useState } from 'react';
import { sendPhoneOtp, mapAuthError } from '../../lib/firebase';

/**
 * Phone + OTP auth panel.
 * onVerified(userCredential) after successful OTP confirm.
 */
export default function PhoneAuthPanel({ onVerified, buttonLabel = 'Continue with phone' }) {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [confirmation, setConfirmation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const sendCode = async () => {
        setLoading(true);
        setError('');
        try {
            const conf = await sendPhoneOtp(phone);
            setConfirmation(conf);
        } catch (err) {
            setError(mapAuthError(err, 'Failed to send OTP'));
        } finally {
            setLoading(false);
        }
    };

    const verify = async () => {
        if (!confirmation) return;
        setLoading(true);
        setError('');
        try {
            const result = await confirmation.confirm(otp.trim());
            onVerified?.(result);
        } catch (err) {
            setError(mapAuthError(err, 'OTP verification failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3">
            <div id="recaptcha-container" />
            {!confirmation ? (
                <>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-ghs-muted uppercase tracking-widest ml-1">Phone number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="024 123 4567"
                            className="w-full h-13 bg-ghs-surface border border-slate-100 rounded-2xl px-4 text-sm font-semibold text-ghs-deep placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-ghs-teal/10 focus:border-ghs-teal"
                        />
                    </div>
                    <button
                        type="button"
                        disabled={loading || !phone.trim()}
                        onClick={sendCode}
                        className="w-full h-12 rounded-2xl bg-white border border-slate-200 font-bold text-sm text-ghs-deep hover:bg-slate-50 disabled:opacity-50"
                    >
                        {loading ? 'Sending…' : buttonLabel}
                    </button>
                </>
            ) : (
                <>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-ghs-muted uppercase tracking-widest ml-1">Enter OTP</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="6-digit code"
                            className="w-full h-13 bg-ghs-surface border border-slate-100 rounded-2xl px-4 text-sm font-bold tracking-widest text-ghs-deep focus:outline-none focus:ring-4 focus:ring-ghs-teal/10 focus:border-ghs-teal"
                        />
                    </div>
                    <button
                        type="button"
                        disabled={loading || otp.length < 4}
                        onClick={verify}
                        className="w-full h-12 rounded-2xl bg-ghs-teal text-white font-bold text-sm disabled:opacity-50"
                    >
                        {loading ? 'Verifying…' : 'Verify OTP'}
                    </button>
                    <button
                        type="button"
                        className="w-full text-xs font-bold text-ghs-muted"
                        onClick={() => { setConfirmation(null); setOtp(''); }}
                    >
                        Change number
                    </button>
                </>
            )}
            {error && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs font-bold text-rose-600">{error}</div>
            )}
        </div>
    );
}
