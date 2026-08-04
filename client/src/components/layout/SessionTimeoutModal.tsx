import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, RefreshCw, LogOut, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import api, { SESSION_EXPIRY_EVENT } from '../../api/axios';

const WARNING_SECONDS = 60; 
const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // Increased to 60 minutes for better UX

const SessionTimeoutModal = () => {
    const { logout } = useAuthStore();
    const [visible, setVisible] = useState(false);
    const [countdown, setCountdown] = useState(WARNING_SECONDS);
    const [renewing, setRenewing] = useState(false);
    
    // Use refs to store timer IDs to ensure they can be cleared reliably
    const logoutTimerRef = React.useRef<any>(null);
    const countdownIntervalRef = React.useRef<any>(null);
    const inactivityTimerRef = React.useRef<any>(null);

    const clearWarningTimers = useCallback(() => {
        if (logoutTimerRef.current) {
            clearTimeout(logoutTimerRef.current);
            logoutTimerRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
    }, []);

    const clearAllTimers = useCallback(() => {
        clearWarningTimers();
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }
    }, [clearWarningTimers]);

    const handleLogout = useCallback(() => {
        clearWarningTimers();
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }
        setVisible(false);
        logout();
    }, [logout, clearWarningTimers]);

    const showWarning = useCallback(() => {
        if (!navigator.onLine || visible) return;

        setVisible(true);
        setCountdown(WARNING_SECONDS);

        // Start countdown
        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) return 0;
                return prev - 1;
            });
        }, 1000);

        // Start auto-logout timer
        logoutTimerRef.current = setTimeout(() => {
            handleLogout();
        }, WARNING_SECONDS * 1000);
    }, [handleLogout, visible]);

    const resetInactivityTimer = useCallback(() => {
        if (visible) return; 
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = setTimeout(showWarning, INACTIVITY_LIMIT_MS);
    }, [visible, showWarning]);

    const handleStayConnected = useCallback(async () => {
        // CRITICAL: Clear logout timers immediately before anything else
        clearWarningTimers();
        
        const { user, checkAuth } = useAuthStore.getState();
        if (!user) {
            handleLogout();
            return;
        }

        setRenewing(true);
        
        try {
            await checkAuth(false); // Refresh session without redirecting on failure
            
            setVisible(false);
            setCountdown(WARNING_SECONDS);
            
            // Restart inactivity tracking
            resetInactivityTimer();
        } catch (err) {
            console.error("Failed to renew session:", err);
            handleLogout();
        } finally {
            setRenewing(false);
        }
    }, [handleLogout, clearWarningTimers, resetInactivityTimer]);

    useEffect(() => {
        // Setup event listeners for inactivity
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach(evt => window.addEventListener(evt, resetInactivityTimer));
        
        // Initial timer start
        resetInactivityTimer();

        // Also listen to the interceptor event just in case
        window.addEventListener(SESSION_EXPIRY_EVENT, showWarning);

        return () => {
            events.forEach(evt => window.removeEventListener(evt, resetInactivityTimer));
            window.removeEventListener(SESSION_EXPIRY_EVENT, showWarning);
            clearAllTimers();
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        };
    }, [resetInactivityTimer, showWarning]);

    const progress = (countdown / WARNING_SECONDS) * 100;
    const isUrgent = countdown <= 15;

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            backgroundColor: 'rgba(0,0,0,0.65)',
                            backdropFilter: 'blur(8px)'
                        }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 20, x: '-50%' }}
                        animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
                        exit={{ opacity: 0, scale: 0.9, y: '-40%', x: '-50%' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        style={{
                            position: 'fixed',
                            top: '50%', left: '50%',
                            zIndex: 10000,
                            width: '100%',
                            maxWidth: '440px',
                            padding: '20px'
                        }}
                    >
                        <div style={{
                            backgroundColor: 'var(--bg-card)',
                            borderRadius: '28px',
                            padding: '40px',
                            border: `2px solid ${isUrgent ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
                            boxShadow: isUrgent
                                ? '0 30px 80px -10px rgba(239,68,68,0.3)'
                                : '0 30px 80px -10px rgba(0,0,0,0.4)',
                            textAlign: 'center',
                            transition: 'border-color 0.4s, box-shadow 0.4s'
                        }}>

                            {/* Icon */}
                            <motion.div
                                animate={{ scale: isUrgent ? [1, 1.12, 1] : 1 }}
                                transition={{ repeat: isUrgent ? Infinity : 0, duration: 0.7 }}
                                style={{
                                    width: '80px', height: '80px',
                                    borderRadius: '24px',
                                    background: isUrgent
                                        ? 'rgba(239,68,68,0.12)'
                                        : 'rgba(245,158,11,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 24px',
                                    border: `2px solid ${isUrgent ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.2)'}`
                                }}>
                                <ShieldAlert
                                    size={38}
                                    color={isUrgent ? '#ef4444' : '#f59e0b'}
                                />
                            </motion.div>

                            <h2 style={{
                                fontSize: '1.6rem', fontWeight: 900,
                                color: 'var(--text-main)', marginBottom: '10px',
                                letterSpacing: '-0.04em'
                            }}>
                                Session sur le point d'expirer
                            </h2>
                            <p style={{
                                color: 'var(--text-muted)', fontSize: '1rem',
                                fontWeight: 600, lineHeight: 1.6, marginBottom: '28px'
                            }}>
                                Votre session sera automatiquement fermée dans quelques instants.
                                Voulez-vous rester connecté ?
                            </p>

                            {/* Countdown Progress Ring */}
                            <div style={{
                                position: 'relative',
                                width: '100px', height: '100px',
                                margin: '0 auto 28px'
                            }}>
                                <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                                    {/* Track */}
                                    <circle cx="50" cy="50" r="42"
                                        fill="none"
                                        stroke="var(--border)"
                                        strokeWidth="8"
                                    />
                                    {/* Progress */}
                                    <motion.circle cx="50" cy="50" r="42"
                                        fill="none"
                                        stroke={isUrgent ? '#ef4444' : '#f59e0b'}
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 42}`}
                                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
                                        style={{ transition: 'stroke-dashoffset 0.8s linear, stroke 0.4s' }}
                                    />
                                </svg>
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <span style={{
                                        fontSize: '1.8rem', fontWeight: 900,
                                        color: isUrgent ? '#ef4444' : '#f59e0b',
                                        lineHeight: 1,
                                        transition: 'color 0.4s'
                                    }}>
                                        {countdown}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                        sec
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleStayConnected}
                                    disabled={renewing}
                                    style={{
                                        width: '100%', padding: '18px',
                                        borderRadius: '18px', border: 'none',
                                        background: 'linear-gradient(135deg, var(--primary) 0%, #8A3A1E 100%)',
                                        color: 'white', fontWeight: 800,
                                        fontSize: '1.05rem',
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: '10px',
                                        cursor: renewing ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 8px 25px -5px rgba(21,94,88,0.5)',
                                        opacity: renewing ? 0.7 : 1,
                                        transition: 'opacity 0.2s'
                                    }}
                                >
                                    {renewing ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                            <RefreshCw size={20} />
                                        </motion.div>
                                    ) : (
                                        <Clock size={20} />
                                    )}
                                    {renewing ? 'Renouvellement...' : 'Oui, rester connecté'}
                                </motion.button>

                                <button
                                    onClick={handleLogout}
                                    style={{
                                        width: '100%', padding: '16px',
                                        borderRadius: '18px',
                                        background: 'transparent',
                                        border: '1.5px solid var(--border)',
                                        color: 'var(--text-muted)',
                                        fontWeight: 700, fontSize: '1rem',
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: '10px',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)';
                                        (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.3)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                                    }}
                                >
                                    <LogOut size={18} />
                                    Non, me déconnecter maintenant
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SessionTimeoutModal;
