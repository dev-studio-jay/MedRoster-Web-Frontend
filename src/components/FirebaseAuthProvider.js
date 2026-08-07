'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthContext = createContext(null);

export function FirebaseAuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [hospitalId, setHospitalId] = useState(null);
    const [role, setRole] = useState(null);
    const [status, setStatus] = useState('loading'); // 'loading' | 'authenticated' | 'unauthenticated'

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setUser(null);
                setHospitalId(null);
                setRole(null);
                setStatus('unauthenticated');
                return;
            }

            try {
                // Fetch user profile from backend to get hospitalId and role
                const token = await firebaseUser.getIdToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/hospitals`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const hospitals = await res.json();
                    const h = hospitals[0];
                    setHospitalId(h?._id || null);
                }

                // Get custom claims for role (set via Admin SDK if needed)
                const tokenResult = await firebaseUser.getIdTokenResult();
                setRole(tokenResult.claims.role || 'admin');
                setUser(firebaseUser);
                setStatus('authenticated');
            } catch {
                setUser(firebaseUser);
                setStatus('authenticated');
            }
        });

        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={{ user, hospitalId, role, status }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useFirebaseAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useFirebaseAuth must be used inside FirebaseAuthProvider');
    return ctx;
}
