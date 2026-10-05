import { initializeApp, getApps } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    RecaptchaVerifier,
    signInWithPhoneNumber,
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);

if (typeof window !== 'undefined' && missing.length) {
    console.error(
        'Firebase web config missing:',
        missing.join(', '),
        '— copy frontend/.env.local.example to .env.local and fill values from Firebase Console.'
    );
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/** Normalize Ghana phone to E.164 (+233...). */
export function toE164Phone(input) {
    const digits = String(input || '').replace(/\D/g, '');
    if (digits.startsWith('233') && digits.length >= 12) return `+${digits}`;
    if (digits.startsWith('0') && digits.length === 10) return `+233${digits.slice(1)}`;
    if (digits.length === 9) return `+233${digits}`;
    if (String(input || '').startsWith('+')) return String(input).replace(/\s/g, '');
    return null;
}

export function setupRecaptcha(containerId = 'recaptcha-container') {
    if (typeof window === 'undefined') return null;
    if (window.__medrosterRecaptcha) return window.__medrosterRecaptcha;
    window.__medrosterRecaptcha = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {},
    });
    return window.__medrosterRecaptcha;
}

export async function sendPhoneOtp(phoneInput) {
    const phone = toE164Phone(phoneInput);
    if (!phone) throw new Error('Enter a valid Ghana phone number (e.g. 0241234567)');
    const verifier = setupRecaptcha();
    return signInWithPhoneNumber(auth, phone, verifier);
}

export function mapAuthError(err, fallback = 'Something went wrong. Please try again.') {
    const code = err?.code;
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return 'Sign-in was cancelled.';
    }
    if (code === 'auth/popup-blocked') {
        return 'Pop-up blocked. Allow pop-ups for this site and try again.';
    }
    if (code === 'auth/account-exists-with-different-credential') {
        return 'An account already exists with this email using a different sign-in method.';
    }
    if (code === 'auth/operation-not-allowed') {
        return 'Phone OTP is not fully enabled. In Firebase Console enable Phone sign-in, then allow Ghana under Authentication → Settings → SMS region policy.';
    }
    if (String(err?.message || '').toLowerCase().includes('region enabled')) {
        return 'SMS cannot be sent to Ghana until the region is allowed. Firebase Console → Authentication → Settings → SMS region policy → add Ghana (GH).';
    }
    if (code === 'auth/invalid-app-credential' || code === 'auth/captcha-check-failed') {
        return 'Phone verification could not start. Add this site to Firebase authorized domains and try again.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        return 'Invalid email or password. Please try again.';
    }
    if (code === 'auth/invalid-verification-code') {
        return 'Invalid OTP code. Please try again.';
    }
    if (code === 'auth/code-expired') {
        return 'OTP expired. Request a new code.';
    }
    if (code === 'auth/too-many-requests') {
        return 'Too many failed attempts. Please wait a moment and try again.';
    }
    return err?.message || fallback;
}
