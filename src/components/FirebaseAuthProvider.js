'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthContext = createContext(null);

export function FirebaseAuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [hospitalId, setHospitalId] = useState(null);
    const [role, setRole] = useState(null);
    const [accountType, setAccountType] = useState(null);
    const [joinCode, setJoinCode] = useState(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setUser(null);
                setHospitalId(null);
                setRole(null);
                setAccountType(null);
                setJoinCode(null);
                setStatus('unauthenticated');
                return;
            }

            try {
                const token = await firebaseUser.getIdToken(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const me = await res.json();
                    setHospitalId(me.hospitalId || null);
                    setRole(me.role || 'admin');
                    setAccountType(me.accountType || null);
                    setJoinCode(me.joinCode || null);
                } else {
                    // Profile may not exist yet (mid-registration)
                    setHospitalId(null);
                    setRole(null);
                    setAccountType(null);
                }
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
        <AuthContext.Provider value={{ user, hospitalId, role, accountType, joinCode, status }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useFirebaseAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useFirebaseAuth must be used inside FirebaseAuthProvider');
    return ctx;
}
