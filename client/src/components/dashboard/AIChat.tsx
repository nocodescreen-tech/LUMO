import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, X, MessageSquare, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';

const AIChat = () => {
    const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
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
            const auth = localStorage.getItem('hub-auth');
            let token = '';
            if (auth) {
               token = JSON.parse(auth).token;
            }

            const response = await fetch(`${(import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/ai/chat`, {
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
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6);
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
                            } catch(e) {}
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
                        className="glass"
                        style={{ 
                            width: isExpanded ? '600px' : '380px', 
                            height: isExpanded ? '700px' : '520px', 
                            borderRadius: '28px', 
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            marginBottom: '16px',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                            transition: 'width 0.3s, height 0.3s'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '20px', background: 'var(--grad-primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ background: 'white', padding: '6px', borderRadius: '10px', color: 'var(--primary)' }}>
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontWeight: '950', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>LUMO Assistant</h4>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: '700' }}>Expert IA Stratégique</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
                                    {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                                </button>
                                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div ref={scrollRef} style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                            {messages.length === 0 && (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Bot size={48} opacity={0.2} style={{ marginBottom: '16px' }} />
                                    <p style={{ fontSize: '0.9rem' }}>Bonjour ! Posez-moi une question sur vos ventes, votre stock ou demandez-moi un conseil stratégique.</p>
                                </div>
                            )}
                            {messages.map((m, i) => (
                                <div key={i} style={{ 
                                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    padding: '14px 18px',
                                    borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                    backgroundColor: m.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
                                    color: m.role === 'user' ? 'white' : 'var(--text-main)',
                                    border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.5',
                                    boxShadow: m.role === 'user' ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'none'
                                }}>
                                    {m.content}
                                </div>
                            ))}
                            {loading && messages[messages.length - 1]?.role === 'user' && (
                                <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.04)', padding: '12px 20px', borderRadius: '20px', display: 'flex', gap: '8px' }}>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span style={{ fontSize: '0.8rem' }}>Analyse en cours...</span>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
                            <input 
                                type="text"
                                placeholder="Posez votre question..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                style={{ flex: 1, padding: '12px 16px', borderRadius: '14px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem' }}
                            />
                            <button 
                                type="submit"
                                disabled={loading || !input.trim()}
                                style={{ width: '44px', height: '44px', borderRadius: '14px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
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
                    cursor: 'pointer', boxShadow: '0 15px 30px -10px rgba(99, 102, 241, 0.6)',
                    position: 'relative'
                }}
            >
                {hasUnread && !isOpen && (
                    <div style={{ 
                        position: 'absolute', top: '-4px', right: '-4px', 
                        width: '20px', height: '20px', backgroundColor: '#ef4444', 
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
