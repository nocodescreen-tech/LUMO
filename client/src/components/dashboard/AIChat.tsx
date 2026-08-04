import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Sparkles, X, MessageSquare, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import { useAuthStore } from '../../store/useAuthStore';

const AIChat = () => {
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const { data } = await api.get('/ai/chat/history');
                if (data && data.length > 0) {
                    setMessages(data);
                }
            } catch (err) {
                console.error("Failed to load chat history", err);
            }
        };
        loadHistory();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user' as const, content: input };
        setMessages(prev => [...prev, userMsg, { role: 'ai', content: '' }]);
        setInput('');
        setLoading(true);

        try {
            const token = useAuthStore.getState().token || '';

            const response = await fetch(`${(import.meta as any).env.VITE_API_BASE_URL || '/api'}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: input })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Erreur réseau');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder('utf-8');
            let aiText = '';

            if (reader) {
                let buffer = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    
                    // keep the last line in the buffer because it might be incomplete
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.trim() === '') continue;
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6).trim();
                            if (dataStr === '[DONE]') {
                                break;
                            }
                            try {
                                const parsed = JSON.parse(dataStr);
                                if (parsed.error) {
                                    aiText += " " + parsed.error;
                                } else if (parsed.text) {
                                    aiText += parsed.text;
                                }
                                setMessages(prev => {
                                    const newMsgs = [...prev];
                                    newMsgs[newMsgs.length - 1] = { role: 'ai', content: aiText };
                                    return newMsgs;
                                });
                            } catch (e) {
                                console.error("Parse error on chunk:", dataStr, e);
                            }
                        }
                    }
                }
            }
        } catch (error: any) {
            const msg = error.message?.includes('Clé')
                ? "⚙️ L'IA n'est pas configurée. Ajoutez DEEPSEEK_API_KEY dans votre fichier .env."
                : "Désolé, je rencontre une petite difficulté technique. Réessayez.";
            setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { role: 'ai', content: msg };
                return newMsgs;
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1100 }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="shadow-2xl"
                        style={{
                            width: isExpanded ? 'min(90vw, 600px)' : 'min(90vw, 380px)',
                            height: isExpanded ? 'min(90vh, 700px)' : 'min(90vh, 520px)',
                            borderRadius: '28px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--bg-card)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            marginBottom: '16px',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                            transition: 'width 0.3s, height 0.3s'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '20px', background: 'var(--grad-primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '10px', color: 'white' }}>
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>LUMO Assistant</h4>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: '700' }}>Expert IA Stratégique</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}>
                                    {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                                </button>
                                <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}>
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div ref={scrollRef} style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-main)' }}>
                            {messages.length === 0 && (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                                    <Bot size={48} color="#155E58" opacity={0.3} style={{ marginBottom: '16px' }} />
                                    <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-muted)', fontWeight: 600 }}>Bonjour ! Posez-moi une question sur vos ventes, votre stock ou demandez-moi un conseil stratégique.</p>
                                </div>
                            )}
                            {messages.map((m, i) => (
                                <div key={i} style={{
                                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    padding: '14px 18px',
                                    borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                    backgroundColor: m.role === 'user' ? '#155E58' : 'var(--bg-card)',
                                    color: m.role === 'user' ? 'white' : 'var(--text-main)',
                                    border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.6',
                                    fontWeight: 500,
                                    boxShadow: m.role === 'user' ? '0 10px 15px -3px rgba(21, 94, 88, 0.3)' : '0 2px 8px rgba(0,0,0,0.3)'
                                }}>
                                    {m.content.split(/(\*\*.*?\*\*|\n)/g).map((part, idx) => {
                                        if (part === '\n') {
                                            return <br key={idx} />;
                                        }
                                        if (part.startsWith('**') && part.endsWith('**')) {
                                            return <strong key={idx}>{part.slice(2, -2)}</strong>;
                                        }
                                        return <span key={idx}>{part}</span>;
                                    })}
                                </div>
                            ))}
                            {loading && messages[messages.length - 1]?.role === 'user' && (
                                <div style={{ alignSelf: 'flex-start', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.06)', padding: '12px 20px', borderRadius: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <Loader2 size={16} className="animate-spin" color="#155E58" />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Analyse en cours...</span>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '12px', backgroundColor: '#1A1A28', flexShrink: 0 }}>
                            <input
                                type="text"
                                placeholder="Posez votre question..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                style={{ flex: 1, padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem', fontWeight: 500 }}
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                style={{ width: '44px', height: '44px', borderRadius: '14px', border: 'none', background: 'var(--grad-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1, transition: 'all 0.2s', flexShrink: 0 }}
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) setHasUnread(false);
                }}
                style={{
                    width: '64px', height: '64px', borderRadius: '22px',
                    background: 'var(--grad-primary)', color: 'white',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 15px 30px -10px rgba(21, 94, 88, 0.6)',
                    position: 'relative'
                }}
            >
                {hasUnread && !isOpen && (
                    <div style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        width: '20px', height: '20px', backgroundColor: 'var(--danger)',
                        border: '3px solid white', borderRadius: '50%',
                        boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                    }}></div>
                )}
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </motion.button>
        </div>
    );
};

export default AIChat;
