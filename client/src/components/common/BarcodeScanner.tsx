import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from '@zxing/library';
import { Camera, X, Usb, RefreshCw, CheckCircle2, AlertCircle, Zap, SwitchCamera, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * PROFIL DU MODULE DE SCAN :
 * 1. Caméra (WebRTC) : Scan réel via flux vidéo.
 * 2. USB/HID : Capture les entrées rapides du clavier (émulation scanner).
 * 3. Manuel : Saisie directe pour les cas d'urgence.
 */

interface BarcodeScannerProps {
    onDetected: (code: string) => void;
    onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected, onClose }) => {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'scanning' | 'error' | 'success'>('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [lastCode, setLastCode] = useState('');
    const [manualCode, setManualCode] = useState('');
    const [tab, setTab] = useState<'camera' | 'usb' | 'manual'>('camera');
    const [usbBuffer, setUsbBuffer] = useState('');
    const cooldownRef = useRef(false);

    // ─── INITIALISATION CAMERA ────────────────────────────────────────────────
    const initCamera = useCallback(async () => {
        setStatus('loading');
        setErrorMsg('');

        try {
            // Nettoyage préalable
            if (readerRef.current) {
                readerRef.current.reset();
                readerRef.current = null;
            }

            // Étape 1 : Demander la permission explicitement
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                // On arrête le flux immédiatement, on veut juste valider l'accès
                stream.getTracks().forEach(track => track.stop());
            } catch (err: any) {
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    throw new Error('PERMISSION_REFUSEE');
                }
                throw err;
            }

            const reader = new BrowserMultiFormatReader();
            readerRef.current = reader;

            // Étape 2 : Lister les caméras
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
            setCameras(videoDevices);

            if (videoDevices.length === 0) {
                setStatus('error');
                setErrorMsg(t('noCameraFound'));
                return;
            }

            // Sélectionner la caméra (ou celle déjà choisie)
            const deviceId = selectedCamera || videoDevices[0].deviceId;
            setSelectedCamera(deviceId);

            if (!videoRef.current) return;

            setStatus('scanning');

            // Étape 3 : Démarrer le scan
            await reader.decodeFromVideoDevice(
                deviceId,
                videoRef.current,
                (result, err) => {
                    if (result && !cooldownRef.current) {
                        const code = result.getText();
                        cooldownRef.current = true;
                        setLastCode(code);
                        setStatus('success');

                        // Petit délai visuel avant de fermer
                        setTimeout(() => {
                            onDetected(code);
                            cooldownRef.current = false;
                        }, 800);
                    } else if (err) {
                        // Ignorer les erreurs de "non-détection" (normal pendant le flux)
                        if (
                            err instanceof NotFoundException ||
                            err instanceof ChecksumException ||
                            err instanceof FormatException
                        ) {
                            return;
                        }
                        // Pour les autres erreurs (ex: already playing), on logge mais on ne bloque pas
                        if (err.message?.includes('already playing')) return;
                    }
                }
            );
        } catch (err: any) {
            console.error('Erreur Camera Scanner:', err);
            setStatus('error');
            if (err.message === 'PERMISSION_REFUSEE') {
                setErrorMsg(t('cameraPermissionDenied'));
            } else if (err.name === 'NotReadableError') {
                setErrorMsg(t('cameraInUse'));
            } else {
                setErrorMsg(t('scannerSystemError').replace('{message}', err.message || t('scannerStartError')));
            }
        }
    }, [selectedCamera, onDetected, t]);

    useEffect(() => {
        if (tab === 'camera') {
            initCamera();
        }
        return () => {
            if (readerRef.current) {
                readerRef.current.reset();
                readerRef.current = null;
            }
        };
    }, [tab, selectedCamera]);

    // ─── LISTENER SCANNER USB (HID) ───────────────────────────────────────────
    useEffect(() => {
        if (tab !== 'usb') return;

        let buffer = '';
        let lastKeyTime = Date.now();

        const handleUSBKeyDown = (e: KeyboardEvent) => {
            // On ignore si on tape dans un champ manuel (sauf notre piège USB)
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' && target.id !== 'usb-trap') return;

            const now = Date.now();
            // Si le délai entre deux touches est > 100ms, c'est un humain qui tape
            if (now - lastKeyTime > 100) {
                buffer = '';
            }
            lastKeyTime = now;

            if (e.key === 'Enter') {
                if (buffer.length >= 3) {
                    const finalCode = buffer.trim();
                    setLastCode(finalCode);
                    setStatus('success');
                    setTimeout(() => onDetected(finalCode), 600);
                }
                buffer = '';
            } else if (e.key.length === 1) {
                buffer += e.key;
                setUsbBuffer(buffer);
            }
        };

        window.addEventListener('keydown', handleUSBKeyDown);
        return () => window.removeEventListener('keydown', handleUSBKeyDown);
    }, [tab, onDetected]);

    // ─── ACTIONS ──────────────────────────────────────────────────────────────
    const switchCamera = () => {
        if (cameras.length <= 1) return;
        const currentIdx = cameras.findIndex(c => c.deviceId === selectedCamera);
        const nextIdx = (currentIdx + 1) % cameras.length;
        setSelectedCamera(cameras[nextIdx].deviceId);
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCode.trim().length >= 3) {
            onDetected(manualCode.trim());
        }
    };

    // ─── RENDU UI ─────────────────────────────────────────────────────────────
    return (
        <div 
            style={{ 
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                zIndex: 9999, padding: '20px' 
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{ 
                    background: 'var(--bg-card)', border: '1px solid var(--border)', 
                    borderRadius: '32px', padding: '32px', width: '100%', 
                    maxWidth: '480px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={24} fill="var(--primary)" />
                        </div>
                        <div>
                            <h2 style={{ fontWeight: 900, fontSize: '1.3rem', margin: 0 }}>{t('productScan')}</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>{t('realCameraUsb')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'var(--bg-main)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '10px', borderRadius: '12px' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Sélecteur de mode */}
                <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-main)', borderRadius: '16px', padding: '6px', marginBottom: '24px', border: '1px solid var(--border)' }}>
                    {[
                        { id: 'camera', label: t('cameraMode'), icon: Camera },
                        { id: 'usb', label: t('usbMode'), icon: Usb },
                        { id: 'manual', label: t('manualMode'), icon: Keyboard }
                    ].map((m) => (
                        <button 
                            key={m.id} 
                            onClick={() => setTab(m.id as any)} 
                            style={{ 
                                flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.2s',
                                background: tab === m.id ? 'var(--primary)' : 'transparent',
                                color: tab === m.id ? 'white' : 'var(--text-muted)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            <m.icon size={16} />
                            {m.label}
                        </button>
                    ))}
                </div>

                {/* Contenu : CAMERA */}
                {tab === 'camera' && (
                    <div style={{ position: 'relative' }}>
                        <div style={{ width: '100%', aspectRatio: '4/3', background: '#000', borderRadius: '24px', overflow: 'hidden', border: '2px solid var(--border)', position: 'relative' }}>
                            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                            
                            {status === 'scanning' && (
                                <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--primary)', borderRadius: '24px', boxShadow: 'inset 0 0 100px rgba(99,102,241,0.2)', pointerEvents: 'none' }}>
                                    <motion.div 
                                        animate={{ top: ['10%', '90%', '10%'] }} 
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                        style={{ position: 'absolute', left: '10%', right: '10%', height: '2px', background: 'var(--primary)', boxShadow: '0 0 15px var(--primary)', zIndex: 10 }} 
                                    />
                                </div>
                            )}

                            {status === 'success' && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
                                    <CheckCircle2 size={64} color="#10b981" />
                                </div>
                            )}

                            {status === 'loading' && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                                    <RefreshCw className="animate-spin" size={32} color="white" />
                                </div>
                            )}
                        </div>

                        {status === 'error' && (
                            <div style={{ marginTop: '16px', padding: '16px', borderRadius: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
                                <AlertCircle size={32} color="#ef4444" style={{ margin: '0 auto 12px' }} />
                                <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{errorMsg}</p>
                                <button onClick={initCamera} style={{ marginTop: '12px', padding: '8px 20px', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 800, cursor: 'pointer' }}>{t('retry')}</button>
                            </div>
                        )}

                        {cameras.length > 1 && status !== 'error' && (
                            <button onClick={switchCamera} style={{ position: 'absolute', bottom: '16px', right: '16px', padding: '12px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)', cursor: 'pointer' }}>
                                <SwitchCamera size={20} />
                            </button>
                        )}
                    </div>
                )}

                {/* Contenu : USB */}
                {tab === 'usb' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <Usb size={40} />
                        </div>
                        <h3 style={{ fontWeight: 800, margin: '0 0 12px' }}>{t('usbScannerReady')}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>{t('usbScannerInstruction')}</p>
                        
                        <input id="usb-trap" autoFocus readOnly value={usbBuffer} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px dashed var(--border)', background: 'var(--bg-main)', color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 900, textAlign: 'center', outline: 'none' }} placeholder={t('waitingForScan')} />
                    </div>
                )}

                {/* Contenu : MANUEL */}
                {tab === 'manual' && (
                    <form onSubmit={handleManualSubmit} style={{ padding: '10px 0' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>{t('barcodeSKU')}</label>
                            <input 
                                autoFocus
                                type="text" 
                                value={manualCode} 
                                onChange={e => setManualCode(e.target.value)} 
                                placeholder={t('manualCodePlaceholder')} 
                                style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid var(--primary)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700, outline: 'none' }}
                            />
                        </div>
                        <button type="submit" disabled={manualCode.length < 3} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', opacity: manualCode.length < 3 ? 0.5 : 1 }}>
                            {t('searchProductButton')}
                        </button>
                    </form>
                )}

                {/* Footer Tip */}
                <div style={{ marginTop: '24px', padding: '12px 16px', background: 'rgba(99,102,241,0.05)', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {t('scannerTip')}
                </div>
            </motion.div>
        </div>
    );
};

export default BarcodeScanner;
