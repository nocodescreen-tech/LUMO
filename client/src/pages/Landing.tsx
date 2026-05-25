import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, BarChart3, CheckCircle2, ChevronDown,
  Cpu, Globe, Loader2, Moon, Package, ShieldCheck,
  ShoppingCart, Sparkles, Sun, TrendingUp, Users, Zap,
  Menu, X, Star, DollarSign, Activity, Lock, Play, ChevronUp, Check, MessageSquare, Smartphone, Mail, Phone, MapPin,
  Facebook, Instagram, Linkedin, Twitter, Calculator, Heart, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';
import Logo from '../components/layout/Logo';
import api from '../api/axios';

// ─── Translations ────────────────────────────────────────────────────────────
const i18n: Record<string, Record<string, string>> = {
  fr: {
    nav_features: 'Fonctionnalités',
    nav_demo: 'Aperçu',
    nav_login: 'Se connecter',
    nav_cta: 'S\'inscrire',
    hero_badge: 'Nouvelle génération de gestion commerciale',
    hero_title_1: 'Gérez votre business',
    hero_title_2: 'comme un expert.',
    hero_sub: "LUMO centralise vos ventes, stock, clients et finances dans une seule plateforme puissante et intuitive.",
    hero_cta: 'Créer un compte',
    hero_cta2: 'Voir une démo',
    stats_stores: 'Boutiques actives',
    stats_uptime: 'Disponibilité',
    stats_support: 'Support 24/7',
    stats_currencies: 'Devises supportées',
    showcase_title: 'Une interface',
    showcase_title2: 'pensée pour la performance',
    showcase_sub: "Chaque module est optimisé pour vous faire gagner du temps et de l'argent.",
    feat_title: 'Tout ce dont vous avez besoin',
    feat_sub: 'Un écosystème complet pour piloter votre commerce au quotidien.',
    feat1_title: 'Caisse (POS) Rapide',
    feat1_desc: 'Terminal de vente ultra-réactif, multi-devises, avec panier, gestion des retours et impression de reçus.',
    feat2_title: 'Dashboard Intelligent',
    feat2_desc: 'Visualisez votre CA, marges et tendances en temps réel grâce à des graphiques dynamiques.',
    feat3_title: 'Stock & Inventaire',
    feat3_desc: 'Suivi précis des stocks, alertes de rupture, gestion des fournisseurs et calcul automatique des marges.',
    feat4_title: 'Multi-Devises',
    feat4_desc: 'Travaillez en USD, CDF avec des conversions instantanées et des rapports multi-monnaies.',
    feat5_title: 'Analytics Avancées',
    feat5_desc: 'Rapports détaillés sur vos ventes, exports Excel et analyses par catégorie sur 7 ou 30 jours.',
    feat6_title: 'Sécurisé & Fiable',
    feat6_desc: 'Données chiffrées, sauvegardes automatiques et contrôle des accès par rôle utilisateur.',
    ai_badge: 'Intelligence Artificielle',
    ai_title: "Analyzé par l'IA, décidé par vous.",
    ai_sub: "L'assistant Lumo analyse vos données et vous propose des insights actionnables pour maximiser votre rentabilité.",
    ai_p1: "Prédictions de ventes basées sur vos historiques",
    ai_p2: "Alertes de stock intelligent avant rupture",
    ai_p3: "Rapports automatiques exportables en Excel",
    ai_p4: "Analyse de la rentabilité produit et marge",
    cta_title: 'Prêt à transformer votre business ?',
    cta_sub: "Rejoignez des commercants qui font confiance à LUMO chaque jour. Configuration en moins de 5 minutes.",
    cta_btn: 'Créer mon compte',
    news_title: 'Restez à jour',
    news_sub: 'Recevez nos nouveautés, tutoriels et mises à jour directement dans votre boîte mail.',
    news_placeholder: 'Votre adresse email',
    news_btn: 'S\'abonner',
    news_success: 'Merci ! Vous êtes maintenant abonné à notre newsletter.',
    news_error: 'Veuillez entrer un email valide.',
    footer_product: 'Produit',
    footer_f1: 'Fonctionnalités',
    footer_f2: 'Multi-Magasins',
    footer_f3: 'Analytiques',
    footer_f4: 'Sécurité',
    footer_company: 'Compagnie',
    footer_c1: 'À propos',
    footer_c2: 'Contact',
    footer_c3: 'Confidentialité',
    footer_c4: 'Conditions d\'utilisation',
    footer_copy: 'All rights reserved.',
    trusted_by: 'Ils nous font confiance au quotidien',
    testi_title: 'Ce que disent nos clients',
    testi_sub: 'Rejoignez la révolution LUMO avec des centaines d\'entrepreneurs satisfaits.',
    faq_title: 'Questions Fréquentes',
    faq_sub: 'Tout ce que vous devez savoir sur LUMO.',
    vs_title: 'LUMO vs Gestion Classique',
    vs_sub: 'Pourquoi passer à la nouvelle génération ?',
    vs_lumo: 'Avec LUMO',
    vs_classic: 'Gestion Classique',
    hiw_title: 'Comment ça marche ?',
    hiw_sub: 'De l\'inscription à la première vente en moins de 5 minutes.',
    hiw_step1: '1. Inscription rapide',
    hiw_step1_desc: 'Créez votre compte en quelques clics sans carte de crédit.',
    hiw_step2: '2. Ajout des produits',
    hiw_step2_desc: 'Importez votre catalogue facilement et configurez vos prix.',
    hiw_step3: '3. Première vente',
    hiw_step3_desc: 'Encaissez vos clients et observez vos statistiques en temps réel.',
    mobile_title: 'Gérez votre boutique depuis votre poche',
    mobile_sub: 'Restez connecté à votre business où que vous soyez. L\'interface LUMO est 100% responsive et fonctionne parfaitement sur tous vos appareils (PC, Tablette, Smartphone).',
    mobile_feat1: 'Suivi des ventes en temps réel',
    mobile_feat2: 'Alertes de stock sur mobile',
    mobile_feat3: 'Mode caisse tactile optimisé',
    contact_title: 'Une question ? Parlez-nous',
    contact_sub: 'Notre équipe de support est là pour vous accompagner dans la digitalisation de votre commerce.',
    contact_email: 'Email de support',
    contact_phone: 'Téléphone direct',
    contact_location: 'Bureaux',
    roi_title: 'Calculez votre rentabilité avec LUMO',
    roi_sub: "Découvrez combien de temps et d'argent vous perdez chaque mois sans une gestion automatisée.",
    roi_sales_per_day: 'Ventes par jour',
    roi_avg_basket: 'Panier moyen (FC)',
    roi_time_saved: 'Temps gagné / mois',
    roi_money_saved: 'Économie estimée / mois',
    roi_hours: 'Heures',
    roi_cta: 'Commencer à gagner du temps',
    team_badge: "L'Équipe",
    team_title: 'Les visages derrière LUMO',
    team_sub: 'Une équipe passionnée dédiée à la réussite des commerçants africains.',
    contact_name: 'Nom',
    contact_email_label: 'Email',
    contact_message: 'Message',
    contact_ph_name: 'Votre nom',
    contact_ph_email: 'votre@email.com',
    contact_ph_message: 'Comment pouvons-nous vous aider ?',
    contact_send: 'Envoyer le message',
    cookie_text: "Nous utilisons des cookies pour améliorer votre expérience et analyser notre trafic.",
    cookie_accept: "Accepter",
    multi_empire_title: 'Un empire, un seul écran',
    multi_empire_sub: 'Gérez toutes vos succursales sans effort. Stock synchronisé, transferts inter-boutiques instantanés et rapports de revenus combinés en temps réel.',
    eyebrow_dashboard: 'Tableau de Bord',
    eyebrow_stock: 'Produits & Stock',
    eyebrow_pos: 'Caisse (POS)',
    eyebrow_analytics: 'Analytiques',
    vs_row1: 'Synchronisation Temps Réel',
    vs_row2: 'Support Multi-Devises',
    vs_row3: 'Assistant IA Intégré',
    vs_row4: 'Interface Moderne',
    vs_row5: 'Accès Multi-Boutiques',
    vs_row6: 'Mode Hors-Ligne',
    testi_eyebrow: 'Avis Clients',
    testi_role1: 'Gérante de Boutique',
    testi_role2: 'Propriétaire de Supermarché',
    testi_role3: 'Entrepreneure',
    testi_text1: "Depuis que j'utilise LUMO, je ne perds plus de temps à faire mes comptes manuellement. L'IA me dit même quand recommander mes produits phares !",
    testi_text2: "La gestion multi-devises est incroyable. Les conversions se font en temps réel, fini les erreurs de caisse entre francs congolais et dollars.",
    testi_text3: "Une interface magnifique, rapide et très intuitive. J'ai formé mes caissiers en moins de 15 minutes. Un vrai game-changer.",
  },
  en: {
    nav_features: 'Features',
    nav_demo: 'Preview',
    nav_login: 'Sign in',
    nav_cta: 'Register',
    hero_badge: 'Next generation business management',
    hero_title_1: 'Manage your business',
    hero_title_2: 'like an expert.',
    hero_sub: "LUMO centralizes your sales, inventory, clients and finances in one powerful and intuitive platform.",
    hero_cta: 'Create an account',
    hero_cta2: 'Watch a demo',
    stats_stores: 'Active stores',
    stats_uptime: 'Uptime',
    stats_support: '24/7 Support',
    stats_currencies: 'Currencies',
    showcase_title: 'An interface',
    showcase_title2: 'built for performance',
    showcase_sub: "Every module is optimized to save you time and money.",
    feat_title: 'Everything you need',
    feat_sub: 'A complete ecosystem to manage your business every day.',
    feat1_title: 'Fast POS',
    feat1_desc: 'Ultra-responsive sales terminal, multi-currency, with cart, returns management and receipt printing.',
    feat2_title: 'Smart Dashboard',
    feat2_desc: 'Visualize your revenue, margins, and trends in real time with dynamic charts.',
    feat3_title: 'Stock & Inventory',
    feat3_desc: 'Precise stock tracking, low-stock alerts, supplier management and automatic margin calculation.',
    feat4_title: 'Multi-Currency',
    feat4_desc: 'Work in USD, CDF or EUR with instant conversions and multi-currency reports.',
    feat5_title: 'Advanced Analytics',
    feat5_desc: 'Detailed reports on sales, Excel exports and category analysis over 7 or 30 days.',
    feat6_title: 'Secure & Reliable',
    feat6_desc: 'Encrypted data, automatic backups and role-based access control.',
    ai_badge: 'Artificial Intelligence',
    ai_title: 'Analyzed by AI, decided by you.',
    ai_sub: "The Lumo assistant analyzes your data and proposes actionable insights to maximize your profitability.",
    ai_p1: "Sales predictions based on your history",
    ai_p2: "Smart stock alerts before running out",
    ai_p3: "Automatic reports exportable to Excel",
    ai_p4: "Product profitability and margin analysis",
    cta_title: 'Ready to transform your business?',
    cta_sub: "Join merchants who trust LUMO every day. Setup in less than 5 minutes.",
    cta_btn: 'Create an account',
    news_title: 'Stay up to date',
    news_sub: 'Receive our news, tutorials and updates directly in your inbox.',
    news_placeholder: 'Your email address',
    news_btn: 'Subscribe',
    news_success: 'Thank you! You are now subscribed to our newsletter.',
    news_error: 'Please enter a valid email.',
    footer_product: 'Product',
    footer_f1: 'Features',
    footer_f2: 'Multi-Store',
    footer_f3: 'Analytics',
    footer_f4: 'Security',
    footer_company: 'Company',
    footer_c1: 'About',
    footer_c2: 'Contact',
    footer_c3: 'Privacy Policy',
    footer_c4: 'Terms of Service',
    footer_copy: 'All rights reserved.',
    trusted_by: 'Trusted by innovative teams worldwide',
    testi_title: 'What our clients say',
    testi_sub: 'Join the LUMO revolution with hundreds of satisfied entrepreneurs.',
    faq_title: 'Frequently Asked Questions',
    faq_sub: 'Everything you need to know about LUMO.',
    vs_title: 'LUMO vs Classic Management',
    vs_sub: 'Why switch to the next generation?',
    vs_lumo: 'With LUMO',
    vs_classic: 'Classic Management',
    hiw_title: 'How does it work?',
    hiw_sub: 'From sign up to your first sale in less than 5 minutes.',
    hiw_step1: '1. Quick Registration',
    hiw_step1_desc: 'Create your account in a few clicks, no credit card required.',
    hiw_step2: '2. Add Products',
    hiw_step2_desc: 'Easily import your catalog and set your prices.',
    hiw_step3: '3. First Sale',
    hiw_step3_desc: 'Checkout customers and watch your real-time statistics grow.',
    mobile_title: 'Manage your store from your pocket',
    mobile_sub: 'Stay connected to your business wherever you are. The LUMO interface is 100% responsive and works perfectly on all your devices (PC, Tablet, Smartphone).',
    mobile_feat1: 'Real-time sales tracking',
    mobile_feat2: 'Mobile low-stock alerts',
    mobile_feat3: 'Optimized touch POS mode',
    contact_title: 'Have a question? Talk to us',
    contact_sub: 'Our support team is here to help you digitize your business.',
    contact_email: 'Support Email',
    contact_phone: 'Direct Phone',
    contact_location: 'Offices',
    roi_title: 'Calculate your profitability with LUMO',
    roi_sub: 'Find out how much time and money you lose each month without automated management.',
    roi_sales_per_day: 'Sales per day',
    roi_avg_basket: 'Average basket (FC)',
    roi_time_saved: 'Time saved / month',
    roi_money_saved: 'Estimated saving / month',
    roi_hours: 'Hours',
    roi_cta: 'Start saving time now',
    team_badge: 'The Team',
    team_title: 'The faces behind LUMO',
    team_sub: 'A passionate team dedicated to African merchants success.',
    contact_name: 'Name',
    contact_email_label: 'Email',
    contact_message: 'Message',
    contact_ph_name: 'Your name',
    contact_ph_email: 'your@email.com',
    contact_ph_message: 'How can we help you?',
    contact_send: 'Send message',
    cookie_text: "We use cookies to enhance your experience and analyze our traffic.",
    cookie_accept: "Accept",
    multi_empire_title: 'One empire, one screen',
    multi_empire_sub: 'Manage all your branches effortlessly. Synchronized stock, instant inter-store transfers, and combined real-time revenue reports.',
    eyebrow_dashboard: 'Dashboard',
    eyebrow_stock: 'Products & Stock',
    eyebrow_pos: 'Point of Sale (POS)',
    eyebrow_analytics: 'Analytics',
    vs_row1: 'Real-time Sync',
    vs_row2: 'Multi-Currency Support',
    vs_row3: 'Integrated AI Assistant',
    vs_row4: 'Modern Interface',
    vs_row5: 'Multi-Store Access',
    vs_row6: 'Offline Mode',
    testi_eyebrow: 'Client Reviews',
    testi_role1: 'Shop Manager',
    testi_role2: 'Supermarket Owner',
    testi_role3: 'Entrepreneur',
    testi_text1: "Since using LUMO, I no longer waste time doing my accounts manually. The AI even tells me when to reorder my best-selling products!",
    testi_text2: "The multi-currency management is amazing. Conversions happen in real-time, no more cash desk errors between francs and dollars.",
    testi_text3: "A beautiful, fast, and very intuitive interface. I trained my cashiers in less than 15 minutes. A real game-changer.",
  }
};

// ─── Newsletter backend hook ──────────────────────────────────────────────────
const useNewsletter = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const subscribe = async (email: string, lang: string) => {
    const trimmed = email.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(trimmed)) { setStatus('error'); return; }
    setStatus('loading');
    try {
      await api.post('/newsletter/subscribe', { email: trimmed });
      setStatus('ok');
    } catch (err: any) {
      // Si l'erreur est que l'email existe déjà, on montre quand même un succès car l'objectif est atteint
      setStatus('ok');
    }
  };
  return { status, subscribe };
};

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ value, duration = 2 }: { value: number, duration?: number }) {
  const [count, setCount] = useState(0);
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    let totalMilSecDur = duration * 1000;
    let incrementTime = (totalMilSecDur / end) * 2;

    let timer = setInterval(() => {
      start += Math.ceil(end / (totalMilSecDur / 50));
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCount(start);
    }, 50);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span ref={nodeRef}>{count}</span>;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Landing() {
  const { theme, setTheme, language, setLanguage } = useAuthStore();
  const navigate = useNavigate();
  const L = i18n[language] || i18n.fr;

  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const { status, subscribe } = useNewsletter();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY, scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, -60]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ nom: '', email: '', message: '' });
  const [sendingContact, setSendingContact] = useState(false);

  useEffect(() => {
    const key = `landing_visit_${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    api.post('/contact/visit', {
      path: window.location.pathname || '/',
      referrer: document.referrer || '',
      ua: navigator.userAgent || '',
      lang: navigator.language || '',
    }).catch(() => {});
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.nom || !contactForm.email || !contactForm.message) {
      toast.error(language === 'fr' ? 'Veuillez remplir tous les champs.' : 'Please fill all fields.');
      return;
    }
    setSendingContact(true);
    try {
      await api.post('/contact', contactForm);
      toast.success(language === 'fr' ? 'Message envoyé avec succès !' : 'Message sent successfully!');
      setContactForm({ nom: '', email: '', message: '' });
    } catch (err) {
      toast.error(language === 'fr' ? "Erreur lors de l'envoi." : "Error sending message.");
    } finally {
      setSendingContact(false);
    }
  };

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setShowBackToTop(latest > 500);
    });
  }, [scrollY]);

  // --- Real Logic for Savings Calculator ---
  const [salesPerDay, setSalesPerDay] = useState(20);
  const [avgBasket, setAvgBasket] = useState(15000);
  const [timeSaved, setTimeSaved] = useState(0);
  const [moneySaved, setMoneySaved] = useState(0);

  useEffect(() => {
    // Math: Manual management takes ~10 mins per sale (counting stock, entry, etc.)
    // LUMO takes ~2 mins. Savings = 8 mins per sale.
    const minutesSaved = salesPerDay * 8;
    const monthlyHours = (minutesSaved * 26) / 60;
    setTimeSaved(Math.round(monthlyHours));

    // Error reduction & automation savings estimated at 5% of turnover
    const monthlyTurnover = salesPerDay * avgBasket * 26;
    setMoneySaved(Math.round(monthlyTurnover * 0.05));
  }, [salesPerDay, avgBasket]);

  // --- Real Logic for Chat Widget ---
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: language === 'fr' ? 'Bonjour ! Je suis LUMO. Comment puis-je vous aider aujourd\'hui ?' : 'Hello! I am LUMO. How can I help you today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/ai/public-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      if (reader) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  aiResponse += parsed.text;
                  setChatMessages(prev => {
                    const last = prev[prev.length - 1];
                    return [...prev.slice(0, -1), { ...last, content: aiResponse }];
                  });
                }
              } catch (e) { }
            }
          }
        }
      }
    } catch (error) {
      toast.error("Erreur de connexion avec LUMO.");
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // --- Cookie Banner State ---
  const [showCookie, setShowCookie] = useState(!localStorage.getItem('lumo_cookies_accepted'));
  const acceptCookies = () => {
    localStorage.setItem('lumo_cookies_accepted', 'true');
    setShowCookie(false);
  };

  // Modal State for Footer Links
  const [footerModal, setFooterModal] = useState<{ open: boolean; title: string; content: string }>({ open: false, title: '', content: '' });

  const handleFooterLink = (title: string, contentFr: string, contentEn: string) => {
    setFooterModal({
      open: true,
      title,
      content: language === 'fr' ? contentFr : contentEn
    });
  };

  // Update theme attribute whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    await subscribe(email, language);
  };

  useEffect(() => {
    if (status === 'ok') {
      toast.success(L.news_success);
      setEmail('');
    }
    if (status === 'error') {
      toast.error(L.news_error);
    }
  }, [status]);

  const features = [
    { icon: ShoppingCart, color: '#6366f1', title: L.feat1_title, desc: L.feat1_desc },
    { icon: BarChart3, color: '#3b82f6', title: L.feat2_title, desc: L.feat2_desc },
    { icon: Package, color: '#10b981', title: L.feat3_title, desc: L.feat3_desc },
    { icon: Globe, color: '#f59e0b', title: L.feat4_title, desc: L.feat4_desc },
    { icon: TrendingUp, color: '#a855f7', title: L.feat5_title, desc: L.feat5_desc },
    { icon: ShieldCheck, color: '#ef4444', title: L.feat6_title, desc: L.feat6_desc },
  ];

  const stats = [
    { value: '2 000+', label: L.stats_stores },
    { value: '99.9%', label: L.stats_uptime },
    { value: '24/7', label: L.stats_support },
    { value: '2', label: L.stats_currencies },
  ];

  const isDark = theme === 'dark';

  return (
    <div className="hide-scrollbar" style={{
      background: 'var(--bg-main)',
      color: 'var(--text-main)',
      fontFamily: "'Outfit', sans-serif",
      minWidth: '1200px',
      overflowX: 'auto',
      minHeight: '100vh',
    }}>
      {/* Scroll Progress Bar */}
      <motion.div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 4,
          background: 'var(--primary)', transformOrigin: '0%', scaleX: scrollYProgress,
          zIndex: 1000
        }}
      />

      {/* Back to top button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              position: 'fixed', bottom: 30, right: 30, zIndex: 999,
              width: 50, height: 50, borderRadius: '50%',
              background: 'var(--primary)', color: 'white',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(99,102,241,0.4)'
            }}
          >
            <ChevronUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Footer Info Modal */}
      <AnimatePresence>
        {footerModal.open && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFooterModal({ ...footerModal, open: false })}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                position: 'relative', width: '100%', maxWidth: 500, background: 'var(--bg-card)',
                borderRadius: 24, padding: 32, zIndex: 10, border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}>
              <button onClick={() => setFooterModal({ ...footerModal, open: false })}
                style={{ position: 'absolute', top: 20, right: 20, background: 'var(--bg-main)', border: 'none', width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
                <X size={18} />
              </button>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 16 }}>{footerModal.title}</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontWeight: 500 }}>{footerModal.content}</p>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="lp-btn-primary" onClick={() => setFooterModal({ ...footerModal, open: false })}>
                  {language === 'fr' ? 'Fermer' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── NAV ───────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 6%', height: '68px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: isDark ? 'rgba(10,10,15,0.85)' : 'rgba(255,255,255,0.88)',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Logo size={34} />
        </div>

        {/* Desktop links - Always visible */}
        <div className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="#features" className="lp-link">{L.nav_features}</a>
          <a href="#showcase" className="lp-link">{L.nav_demo}</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Lang */}
          <button className="lp-icon-btn" onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: 1 }}>
              {language === 'fr' ? 'EN' : 'FR'}
            </span>
          </button>
          {/* Theme */}
          <button className="lp-icon-btn" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className="lp-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="lp-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
              onClick={() => navigate('/login')}>
              {L.nav_login}
            </button>
            <button className="lp-btn-primary" onClick={() => navigate('/register')}>
              {L.nav_cta}
            </button>
          </div>

        </div>
      </nav>



      {/* ── HERO ──────────────────────────────────────────────── */}
      <section ref={heroRef} style={{ position: 'relative', overflow: 'hidden', paddingTop: 140, paddingBottom: 80, textAlign: 'center' }}>
        {/* BG glow */}
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 500,
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* FLOATING VISUALS */}
        <motion.div animate={{ y: [-15, 15, -15], rotate: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          style={{ position: 'absolute', top: '20%', left: '10%', zIndex: 0, opacity: 0.15 }}>
          <ShoppingCart size={120} color="var(--primary)" />
        </motion.div>

        <motion.div animate={{ y: [20, -20, 20], rotate: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          style={{ position: 'absolute', top: '15%', right: '12%', zIndex: 0, opacity: 0.15 }}>
          <Package size={100} color="#10b981" />
        </motion.div>

        <motion.div animate={{ y: [-10, 10, -10], rotate: [0, 5, 0], scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          style={{ position: 'absolute', bottom: '15%', left: '18%', zIndex: 0, opacity: 0.12 }}>
          <BarChart3 size={90} color="#f59e0b" />
        </motion.div>

        <motion.div animate={{ y: [15, -15, 15], rotate: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
          style={{ position: 'absolute', bottom: '25%', right: '15%', zIndex: 0, opacity: 0.12 }}>
          <DollarSign size={80} color="#a855f7" />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY, position: 'relative', zIndex: 1 }}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
        >
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <span className="lp-badge">
              <Sparkles size={13} style={{ marginRight: 6 }} />
              {L.hero_badge}
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(2.6rem, 6.5vw, 4.8rem)',
            fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.08,
            margin: '0 auto 20px auto', maxWidth: 840,
            color: 'var(--text-main)'
          }}>
            {L.hero_title_1}<br />
            <span style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {L.hero_title_2}
            </span>
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)', fontWeight: 500, color: 'var(--text-muted)',
            maxWidth: 600, margin: '0 auto 40px auto', lineHeight: 1.65,
          }}>
            {L.hero_sub}
          </p>

          {/* CTA buttons */}
          <div className="lp-hero-btns" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="lp-btn-primary lp-btn-lg" onClick={() => navigate('/register')}>
              {L.hero_cta} <ArrowRight size={18} style={{ marginLeft: 8 }} />
            </button>
            <button className="lp-btn-ghost lp-btn-lg" onClick={() => { document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' }); }}>
              {L.hero_cta2}
            </button>
          </div>

          {/* Scroll hint */}
          <motion.div
            animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
            style={{ marginTop: 60, display: 'flex', justifyContent: 'center', opacity: 0.4 }}
          >
            <ChevronDown size={24} />
          </motion.div>
        </motion.div>

        {/* Trusted By */}
        <div style={{ marginTop: 100, borderTop: '1px solid var(--border)', paddingTop: 40, width: '100%', maxWidth: 1000, margin: '100px auto 0' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 30 }}>
            {L.trusted_by}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(20px, 6vw, 60px)', flexWrap: 'wrap', opacity: 0.6, filter: isDark ? 'grayscale(100%) invert(1)' : 'grayscale(100%)' }}>
            <svg width="120" height="35" viewBox="0 0 120 35" fill="none"><path d="M10 17L20 7H30L20 17L30 27H20L10 17Z" fill="currentColor" /><text x="35" y="23" fontFamily="Arial" fontWeight="bold" fontSize="18" fill="currentColor">AcmeCorp</text></svg>
            <svg width="110" height="35" viewBox="0 0 110 35" fill="none"><circle cx="15" cy="17" r="10" fill="currentColor" /><text x="30" y="23" fontFamily="Arial" fontWeight="bold" fontSize="18" fill="currentColor">GlobalTech</text></svg>
            <svg width="100" height="35" viewBox="0 0 100 35" fill="none"><rect x="5" y="7" width="20" height="20" rx="4" fill="currentColor" /><text x="32" y="23" fontFamily="Arial" fontWeight="bold" fontSize="18" fill="currentColor">Nexus</text></svg>
            <svg width="120" height="35" viewBox="0 0 120 35" fill="none"><path d="M15 5L25 25H5L15 5Z" fill="currentColor" /><text x="30" y="23" fontFamily="Arial" fontWeight="bold" fontSize="18" fill="currentColor">Vertex</text></svg>
          </div>
        </div>
      </section>

      {/* ── STATS RIBBON ──────────────────────────────────────── */}
      <section style={{
        padding: '40px 6%',
        background: isDark
          ? 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06))'
          : 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(168,85,247,0.03))',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 32 }}>
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1 }} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 950, color: 'var(--primary)', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.value.includes('+') || s.value.includes('%') ? (
                  <>
                    <AnimatedCounter value={parseInt(s.value.replace(/\D/g, ''))} />
                    {s.value.replace(/[0-9\s]/g, '')}
                  </>
                ) : s.value}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: 4 }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── VIDEO / DEMO PREVIEW ────────────────────────────── */}
      <section style={{ padding: '80px 6% 40px', display: 'flex', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{
            width: '100%', maxWidth: 1000, borderRadius: 24, padding: 8,
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            border: '1px solid var(--border)', position: 'relative'
          }}
        >
          <div style={{
            width: '100%', aspectRatio: '16/9', borderRadius: 16, overflow: 'hidden',
            background: 'var(--bg-main)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundImage: 'url(/screen3.png)', backgroundSize: 'cover', backgroundPosition: 'center',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              style={{
                width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)',
                color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 10, boxShadow: '0 10px 30px rgba(99,102,241,0.5)'
              }}
            >
              <Play size={36} style={{ marginLeft: 4 }} />
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ── SHOWCASE / BIG FEATURES ─────────────────────────── */}
      <section id="showcase" style={{ padding: '120px 6%', display: 'flex', flexDirection: 'column', gap: '120px' }}>
        <div style={{ textAlign: 'center', marginBottom: -20 }}>
          <span className="lp-section-eyebrow">En Détail</span>
          <h2 className="lp-section-title">
            {L.showcase_title} <span style={{ color: 'var(--primary)' }}>{L.showcase_title2}</span>
          </h2>
          <p className="lp-section-sub">{L.showcase_sub}</p>
        </div>

        {/* Feature 1 */}
        <div className="lp-feature-split">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} className="lp-split-text">
            <span className="lp-feature-eyebrow" style={{ color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)' }}>{L.eyebrow_dashboard}</span>
            <h2 className="lp-split-title">
              {language === 'fr' ? 'Pleine visibilité sur votre activité.' : 'Full visibility on your business.'}
            </h2>
            <p className="lp-split-desc">
              {language === 'fr' ? 'Gardez un œil sur votre chiffre d\'affaires, vos marges et votre croissance en temps réel. Des graphiques clairs et une interface épurée pour prendre les meilleures décisions sans stress.' : 'Keep an eye on your revenue, margins, and growth in real time. Clear charts and a clean interface to make the best decisions stress-free.'}
            </p>
            <ul className="lp-split-list">
              <li><CheckCircle2 color="#3b82f6" size={20} /> {language === 'fr' ? 'Suivi financier en temps réel' : 'Real-time financial tracking'}</li>
              <li><CheckCircle2 color="#3b82f6" size={20} /> {language === 'fr' ? 'Indicateurs clés de performance (KPI)' : 'Key Performance Indicators (KPI)'}</li>
              <li><CheckCircle2 color="#3b82f6" size={20} /> {language === 'fr' ? 'Comparaison et évolution des périodes' : 'Period evolution and comparison'}</li>
            </ul>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} className="lp-split-image">
            <div className="lp-glass-overlay"></div>
            <img src="/screen3.png" alt="Dashboard LUMO" />
          </motion.div>
        </div>

        {/* Feature 2: Reversed */}
        <div className="lp-feature-split reverse">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} className="lp-split-image">
            <div className="lp-glass-overlay"></div>
            <img src="/screen2.png" alt="Stock LUMO" />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} className="lp-split-text">
            <span className="lp-feature-eyebrow" style={{ color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' }}>{L.eyebrow_stock}</span>
            <h2 className="lp-split-title">
              {language === 'fr' ? 'Gestion d\'inventaire intelligente.' : 'Smart Inventory Management.'}
            </h2>
            <p className="lp-split-desc">
              {language === 'fr' ? 'Ne perdez plus le fil de votre stock. Suivez vos niveaux précisément, recevez des alertes automatiques avant les ruptures, et gérez vos approvisionnements chez vos fournisseurs en quelques clics.' : 'Never lose track of your stock. Track levels accurately, receive automatic alerts before shortages, and manage supplier restocks in a few clicks.'}
            </p>
            <ul className="lp-split-list">
              <li><CheckCircle2 color="#10b981" size={20} /> {language === 'fr' ? 'Alertes préventives de stock bas' : 'Preventive low stock alerts'}</li>
              <li><CheckCircle2 color="#10b981" size={20} /> {language === 'fr' ? 'Calcul de marge bénéficiaire exact' : 'Exact profit margin calculation'}</li>
              <li><CheckCircle2 color="#10b981" size={20} /> {language === 'fr' ? 'Historique complet des mouvements' : 'Complete movement history'}</li>
            </ul>
          </motion.div>
        </div>

        {/* Feature 3 */}
        <div className="lp-feature-split">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} className="lp-split-text">
            <span className="lp-feature-eyebrow" style={{ color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' }}>{L.eyebrow_pos}</span>
            <h2 className="lp-split-title">
              {language === 'fr' ? 'Point de Vente Ultra-Rapide.' : 'Lightning-Fast Point of Sale.'}
            </h2>
            <p className="lp-split-desc">
              {language === 'fr' ? 'Conçu pour la fluidité au comptoir physique. Traitez vos ventes en devises multiples, encaissez en scanning de codes-barres et imprimez vos factures thermiques instantanément.' : 'Built for physical counter fluidity. Process sales in multiple currencies, checkout with barcode scanning and print thermal receipts instantly.'}
            </p>
            <ul className="lp-split-list">
              <li><CheckCircle2 color="#f59e0b" size={20} /> {language === 'fr' ? 'Prise en charge intégrale des scanners' : 'Full barcode scanner support'}</li>
              <li><CheckCircle2 color="#f59e0b" size={20} /> {language === 'fr' ? 'Paiement mixte et Multi-devises' : 'Mixed and Multi-currency payments'}</li>
              <li><CheckCircle2 color="#f59e0b" size={20} /> {language === 'fr' ? 'Génération de tickets rapide' : 'Fast receipt generation'}</li>
            </ul>
          </motion.div><motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} className="lp-split-image">
            <div className="lp-glass-overlay"></div>
            <img src="/screen5.png" alt="POS LUMO" />
          </motion.div>
        </div>

        {/* Feature 4: Reversed */}
        <div className="lp-feature-split reverse">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} className="lp-split-image">
            <div className="lp-glass-overlay"></div>
            <img src="/screen1.png" alt="Analytiques LUMO" />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} className="lp-split-text">
            <span className="lp-feature-eyebrow" style={{ color: '#a855f7', backgroundColor: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.2)' }}>{L.eyebrow_analytics}</span>
            <h2 className="lp-split-title">
              {language === 'fr' ? 'Des données brutes aux décisions.' : 'From raw data to decisions.'}
            </h2>
            <p className="lp-split-desc">
              {language === 'fr' ? 'Extrayez tout le potentiel de votre boutique. Exportez vos données vers Excel, visualisez quels produits performent le mieux, et suivez l\'efficacité de chaque vendeur dans votre équipe.' : 'Extract full potential from your store. Export your data to Excel, view which products perform best, and track the efficiency of each salesman.'}
            </p>
            <ul className="lp-split-list">
              <li><CheckCircle2 color="#a855f7" size={20} /> {language === 'fr' ? 'Exports Excel natifs en 1 clic' : '1-click native Excel exports'}</li>
              <li><CheckCircle2 color="#a855f7" size={20} /> {language === 'fr' ? 'Identification des produits stars' : 'Star products identification'}</li>
              <li><CheckCircle2 color="#a855f7" size={20} /> {language === 'fr' ? 'Classement des performances vendeurs' : 'Staff performance leaderboard'}</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section id="features" style={{ padding: '100px 6%', background: isDark ? 'rgba(255,255,255,0.012)' : 'rgba(0,0,0,0.012)' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <span className="lp-section-eyebrow">Modules</span>
          <h2 className="lp-section-title">{L.feat_title}</h2>
          <p className="lp-section-sub">{L.feat_sub}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 24 }}>
          {features.map((f, i) => (
            <motion.div key={i} className="lp-feature-card"
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6 }}>
              <div className="lp-feature-icon" style={{ background: `${f.color}18`, color: f.color }}>
                <f.icon size={26} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '16px 0 10px', color: 'var(--text-main)' }}>{f.title}</h3>
              <p style={{ fontSize: '0.93rem', color: 'var(--text-muted)', lineHeight: 1.65, fontWeight: 500 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ padding: '100px 6%', background: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <span className="lp-section-eyebrow">Digitalisation</span>
          <h2 className="lp-section-title">{L.hiw_title}</h2>
          <p className="lp-section-sub">{L.hiw_sub}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, maxWidth: 1100, margin: '0 auto' }}>
          {[
            { title: L.hiw_step1, desc: L.hiw_step1_desc, icon: Zap, color: '#6366f1' },
            { title: L.hiw_step2, desc: L.hiw_step2_desc, icon: Package, color: '#10b981' },
            { title: L.hiw_step3, desc: L.hiw_step3_desc, icon: ShoppingCart, color: '#f59e0b' }
          ].map((step, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              style={{ textAlign: 'center', padding: '0 20px' }}>
              <div style={{
                width: 80, height: 80, borderRadius: 24, background: `${step.color}10`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                border: `1.5px solid ${step.color}20`
              }}>
                <step.icon size={32} color={step.color} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: 12, color: 'var(--text-main)' }}>{step.title}</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 500 }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── MULTI-MAGASINS ────────────────────────────────────── */}
      <section id="multi-magasins" style={{ padding: '100px 6%', position: 'relative' }}>
        <div style={{
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          borderRadius: 40, border: '1.5px solid var(--border)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '80px 40px', textAlign: 'center',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          boxShadow: isDark ? '0 25px 50px -12px rgba(0,0,0,0.3)' : '0 25px 50px -12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ width: 72, height: 72, borderRadius: 24, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Globe size={36} color="#3b82f6" />
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 950, marginBottom: 24, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {L.multi_empire_title}
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: 640, margin: '0 auto 48px', lineHeight: 1.6, fontWeight: 500 }}>
            {L.multi_empire_sub}
          </p>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { n: 'Kinshasa (HQ)', delay: 0 },
              { n: 'Gombe Center', delay: 0.1 },
              { n: 'Limete Store', delay: 0.2 }
            ].map((ville, i) => (
              <motion.div key={ville.n}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: ville.delay }}
                style={{
                  background: 'var(--bg-main)', padding: '20px 32px', borderRadius: 20,
                  border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                }}>
                <div className="lp-pulse-dot" style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>{ville.n}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI SECTION (ANALYTIQUES) ──────────────────────────── */}
      <section id="analytiques" style={{ padding: '100px 6%' }}>
        <div style={{
          borderRadius: 32,
          border: '1.5px solid var(--border)',
          background: isDark
            ? 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(168,85,247,0.05) 100%)'
            : 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(168,85,247,0.03) 100%)',
          padding: 'clamp(40px, 6vw, 72px)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center',
        }}>
          {/* Left */}
          <div>
            <span className="lp-section-eyebrow" style={{ color: '#a855f7', borderColor: 'rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.08)' }}>
              {L.ai_badge}
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 950, lineHeight: 1.15, margin: '18px 0 24px', color: 'var(--text-main)' }}>
              {L.ai_title}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 32, fontWeight: 500 }}>
              {L.ai_sub}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[L.ai_p1, L.ai_p2, L.ai_p3, L.ai_p4].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>
                  <CheckCircle2 size={19} style={{ color: '#a855f7', flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right – AI card mock */}
          <motion.div initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }}
            style={{
              background: 'var(--bg-main)', borderRadius: 20,
              border: '1.5px solid var(--border)',
              padding: 28, boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.4)' : '0 20px 60px rgba(0,0,0,0.08)',
            }}>
            {/* Window chrome */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {['#ef4444', '#f59e0b', '#10b981'].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
              ))}
              <div style={{ flex: 1, height: 10, borderRadius: 6, background: 'var(--border)', marginLeft: 8 }} />
            </div>
            {/* Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={13} color="white" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#a855f7' }}>Lumo AI</span>
            </div>
            <p style={{ fontStyle: 'italic', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.65, marginBottom: 20 }}>
              {language === 'fr'
                ? '"Vos ventes de la semaine ont augmenté de 18%. Le produit Casque X-5 est en rupture imminente — commandez 30 unités pour maintenir la dynamique."'
                : '"Your weekly sales increased by 18%. Product Headset X-5 is nearly out of stock — order 30 units to maintain momentum."'}
            </p>
            {/* Fake chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: '+18% CA', c: '#10b981' },
                { label: language === 'fr' ? 'Stock critique' : 'Low stock', c: '#ef4444' },
                { label: language === 'fr' ? 'Rapport prêt' : 'Report ready', c: '#6366f1' },
              ].map(chip => (
                <span key={chip.label} style={{
                  padding: '4px 12px', borderRadius: 99,
                  background: `${chip.c}18`, color: chip.c,
                  fontWeight: 800, fontSize: '0.75rem',
                }}>
                  {chip.label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── MOBILE SHOWCASE ──────────────────────────────────── */}
      <section style={{ padding: '100px 6%', overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 80, alignItems: 'center',
          background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
          borderRadius: 40, padding: '80px 60px', border: '1px solid var(--border)'
        }}>
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}>
            <span className="lp-section-eyebrow" style={{ color: '#10b981', borderColor: 'rgba(168,85,247,0.3)', background: 'rgba(16,185,129,0.08)' }}>Mobile</span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 950, marginBottom: 24, color: 'var(--text-main)', lineHeight: 1.1 }}>
              {L.mobile_title}
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 40, fontWeight: 500 }}>
              {L.mobile_sub}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[L.mobile_feat1, L.mobile_feat2, L.mobile_feat3].map((feat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ background: '#10b98120', padding: 8, borderRadius: 12 }}>
                    <Smartphone size={20} color="#10b981" />
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem' }}>{feat}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 60, rotate: 5 }}
            whileInView={{ opacity: 1, y: 0, rotate: -5 }}
            style={{ position: 'relative' }}
          >
            {/* Phone Mockup visual */}
            <div style={{
              width: 280, height: 580, background: '#111', borderRadius: 45, margin: '0 auto',
              border: '8px solid #333', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, width: '40%', height: 25, background: '#333', left: '30%', borderBottomLeftRadius: 15, borderBottomRightRadius: 15 }} />
              <img src="/dashboard_mobile.png" alt="Dashboard LUMO" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              <div style={{ position: 'absolute', bottom: 40, left: 20, right: 20, background: 'rgba(0,0,0,0.8)', padding: 15, borderRadius: 15, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 900, marginBottom: 4 }}>NOTIFICATION</div>
                <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>Nouvelle vente ! +450.00$</div>
              </div>
            </div>
            {/* Background glow */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, background: 'rgba(16,185,129,0.15)', filter: 'blur(80px)', zIndex: -1 }} />
          </motion.div>
        </div>
      </section>

      {/* ── SECURITY ──────────────────────────────────────────── */}
      <section id="securite" style={{ padding: '100px 6%', background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 60, alignItems: 'center' }}>
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: '#ef444415',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32
            }}>
              <ShieldCheck size={36} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 950, marginBottom: 24, color: 'var(--text-main)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {language === 'fr' ? 'Sécurité Avancée' : 'Advanced Security'}
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32, fontWeight: 500, maxWidth: 500 }}>
              {language === 'fr'
                ? 'Nous prenons la sécurité de vos données au sérieux. Tout est chiffré, scellé et sauvegardé automatiquement. Aucun compromis.'
                : 'We take your data security seriously. Everything is encrypted, sealed, and automatically backed up. No compromises.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                language === 'fr' ? 'Chiffrement AES-256 de bout en bout' : 'AES-256 end-to-end encryption',
                language === 'fr' ? 'Sauvegardes automatiques sans perte' : 'Zero-loss automatic backups',
                language === 'fr' ? 'Protection Rate Limiting anti-bruteforce' : 'Anti-bruteforce Rate Limiting protection',
              ].map(text => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ background: '#ef444420', padding: 6, borderRadius: '50%' }}>
                    <Lock size={14} color="#ef4444" />
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Secure Vault Visual */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
            style={{
              position: 'relative', height: 440, borderRadius: 32,
              background: isDark ? 'linear-gradient(135deg, #111827 0%, #000000 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isDark ? '0 30px 60px rgba(0,0,0,0.4)' : '0 30px 60px rgba(0,0,0,0.1)',
            }}>
            {/* Ambient Red Glow */}
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', filter: 'blur(60px)' }} />

            {/* Vault Rings */}
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
              style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', border: '2px dashed rgba(239,68,68,0.3)' }} />
            <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
              style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: '2px dashed rgba(239,68,68,0.5)' }} />

            <motion.div whileHover={{ scale: 1.1 }}
              style={{
                width: 100, height: 100, borderRadius: '50%', background: isDark ? '#1f2937' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                boxShadow: isDark ? '0 0 50px rgba(239,68,68,0.2)' : '0 20px 40px rgba(0,0,0,0.1)',
                border: '1.5px solid var(--border)'
              }}>
              <ShieldCheck size={42} color="#ef4444" />
            </motion.div>
          </motion.div>
        </div>
      </section>



      {/* ── COMPARISON TABLE ──────────────────────────────────── */}
      <section style={{ padding: '100px 6%', background: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span className="lp-section-eyebrow">Comparaison</span>
          <h2 className="lp-section-title">{L.vs_title}</h2>
          <p className="lp-section-sub">{L.vs_sub}</p>
        </div>
        <div style={{ maxWidth: 900, margin: '0 auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
            <thead>
              <tr>
                <th style={{ padding: '20px', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>Fonctionnalité</th>
                <th style={{ padding: '20px', borderBottom: '2px solid var(--border)', background: 'rgba(99,102,241,0.05)', color: 'var(--primary)', borderRadius: '16px 16px 0 0', textAlign: 'center' }}>{L.vs_lumo}</th>
                <th style={{ padding: '20px', borderBottom: '2px solid var(--border)', color: 'var(--text-main)', textAlign: 'center' }}>{L.vs_classic}</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Synchronisation Temps Réel', true, false],
                ['Support Multi-Devises (USD/CDF)', true, false],
                ['Assistant IA Intégré', true, false],
                ['Interface Moderne & Rapide', true, false],
                ['Accès Multi-Boutiques', true, true],
                ['Mode Hors-Ligne', true, false],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '20px', fontWeight: 600, color: 'var(--text-main)' }}>{row[0]}</td>
                  <td style={{ padding: '20px', background: 'rgba(99,102,241,0.02)', textAlign: 'center' }}>
                    {row[1] ? <Check size={24} color="#10b981" style={{ margin: '0 auto' }} /> : <X size={24} color="#ef4444" style={{ margin: '0 auto' }} />}
                  </td>
                  <td style={{ padding: '20px', textAlign: 'center' }}>
                    {row[2] ? <Check size={24} color="#10b981" style={{ margin: '0 auto' }} /> : <X size={24} color="#ef4444" style={{ margin: '0 auto' }} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────── */}
      <section style={{ padding: '100px 6%', background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span className="lp-section-eyebrow">{L.testi_eyebrow}</span>
          <h2 className="lp-section-title">{L.testi_title}</h2>
          <p className="lp-section-sub">{L.testi_sub}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 30, maxWidth: 1100, margin: '0 auto' }}>
          {[
            { name: 'Sarah M.', role: L.testi_role1, text: L.testi_text1, rating: 5 },
            { name: 'David K.', role: L.testi_role2, text: L.testi_text2, rating: 5 },
            { name: 'Amina T.', role: L.testi_role3, text: L.testi_text3, rating: 5 }
          ].map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ background: 'var(--bg-card)', padding: 30, borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {[...Array(t.rating)].map((_, j) => <Star key={j} size={18} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p style={{ fontStyle: 'italic', color: 'var(--text-main)', marginBottom: 24, lineHeight: 1.6 }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{t.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section style={{ padding: '80px 6% 120px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span className="lp-section-eyebrow">FAQ</span>
          <h2 className="lp-section-title">{L.faq_title}</h2>
          <p className="lp-section-sub">{L.faq_sub}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { q: language === 'fr' ? 'Puis-je utiliser LUMO sans connexion internet ?' : 'Can I use LUMO without internet?', a: language === 'fr' ? 'Oui ! Notre application possède un mode hors-ligne. Vous pouvez continuer à vendre, et les données se synchroniseront automatiquement dès que la connexion sera rétablie.' : 'Yes! Our app has an offline mode. You can keep selling, and data will sync automatically once connection is back.' },
            { q: language === 'fr' ? 'Comment fonctionne la gestion multi-devises ?' : 'How does multi-currency management work?', a: language === 'fr' ? 'Vous définissez votre taux de change. Lors d\'une vente, vous pouvez encaisser en Francs Congolais ou en Dollars, et le système calcule automatiquement le rendu de la monnaie et met à jour votre caisse.' : 'You set your exchange rate. During a sale, you can checkout in Congolese Francs or Dollars, and the system automatically calculates change and updates your cash.' },
            { q: language === 'fr' ? 'Mes données sont-elles sécurisées ?' : 'Is my data secure?', a: language === 'fr' ? 'Absolument. Vos données sont chiffrées et nous effectuons des sauvegardes automatiques plusieurs fois par jour sur des serveurs sécurisés.' : 'Absolutely. Your data is encrypted and we perform automatic backups several times a day on secure servers.' },
            { q: language === 'fr' ? 'Ai-je besoin de matériel spécial ?' : 'Do I need special hardware?', a: language === 'fr' ? 'Non, LUMO fonctionne sur n\'importe quel ordinateur, tablette ou smartphone. Nous supportons également la majorité des lecteurs de codes-barres et imprimantes thermiques Bluetooth/USB.' : 'No, LUMO works on any computer, tablet or smartphone. We also support most barcode scanners and Bluetooth/USB thermal printers.' }
          ].map((faq, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 16, background: 'var(--bg-card)', overflow: 'hidden' }}>
              <button onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)} style={{ width: '100%', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 700, fontSize: '1.05rem', textAlign: 'left' }}>
                {faq.q}
                <ChevronDown size={20} style={{ transform: openFaqIndex === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
              </button>
              <AnimatePresence>
                {openFaqIndex === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0 24px 24px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ── SAVINGS CALCULATOR ────────────────────────────────── */}
      <section id="calculator" style={{ padding: '100px 6%', background: isDark ? 'rgba(99,102,241,0.03)' : 'rgba(99,102,241,0.02)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}>
            <span className="lp-section-eyebrow">{language === 'fr' ? 'Calculateur ROI' : 'ROI Calculator'}</span>
            <h2 className="lp-section-title" style={{ textAlign: 'left', margin: '0 0 20px' }}>
              {L.roi_title}
            </h2>
            <p className="lp-section-sub" style={{ textAlign: 'left', margin: '0 0 40px' }}>
              {L.roi_sub}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <label style={{ fontWeight: 800, fontSize: '0.95rem' }}>{L.roi_sales_per_day}</label>
                  <span style={{ color: 'var(--primary)', fontWeight: 900 }}>{salesPerDay}</span>
                </div>
                <input type="range" min="1" max="200" value={salesPerDay} onChange={(e) => setSalesPerDay(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <label style={{ fontWeight: 800, fontSize: '0.95rem' }}>{L.roi_avg_basket}</label>
                  <span style={{ color: 'var(--primary)', fontWeight: 900 }}>{avgBasket.toLocaleString()} FC</span>
                </div>
                <input type="range" min="5000" max="500000" step="5000" value={avgBasket} onChange={(e) => setAvgBasket(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }} />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
            style={{ background: 'var(--bg-card)', padding: 40, borderRadius: 32, border: '1.5px solid var(--border)', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'grid', gap: 24 }}>
              <div style={{ padding: 24, borderRadius: 20, background: 'var(--bg-main)', border: '1.5px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <Activity size={20} color="#10b981" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{L.roi_time_saved}</span>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--text-main)' }}>{timeSaved} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>{L.roi_hours}</span></div>
              </div>
              <div style={{ padding: 24, borderRadius: 20, background: 'var(--bg-main)', border: '1.5px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <DollarSign size={20} color="#f59e0b" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{L.roi_money_saved}</span>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--text-main)' }}>{moneySaved.toLocaleString()} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>FC</span></div>
              </div>
            </div>
            <button className="lp-btn-primary" style={{ width: '100%', marginTop: 32, padding: '18px', fontSize: '1rem' }} onClick={() => navigate('/register')}>
              {L.roi_cta}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── TEAM SECTION ───────────────────────────────────────── */}
      <section id="team" style={{ padding: '100px 6%' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <span className="lp-section-eyebrow">{L.team_badge}</span>
          <h2 className="lp-section-title">{L.team_title}</h2>
          <p className="lp-section-sub">{L.team_sub}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 32, maxWidth: 1000, margin: '0 auto' }}>
          {[
            { name: 'René Des.', role: 'Lead Architect & Founder', img: '/team/rene.png' },
            { name: 'Mardoché Nl.', role: 'Product Designer', img: '/team/sarah.png' },
          ].map((m, i) => (
            <motion.div key={i} whileHover={{ y: -10 }} style={{ textAlign: 'center' }}>
              <div style={{ width: 180, height: 180, borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', overflow: 'hidden', margin: '0 auto 24px', border: '4px solid var(--primary)' }}>
                <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 4 }}>{m.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>{m.role}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
                <a href={i === 0 ? "https://www.linkedin.com/in/ren%C3%A9-nzaku-1b7413408/" : "#"} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}><Linkedin size={16} className="lp-footer-item" /></a>
                <a href={i === 0 ? "https://x.com/rendevui" : "#"} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}><Twitter size={16} className="lp-footer-item" /></a>
                {i === 0 && <a href="https://web.facebook.com/rcdevui" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}><Facebook size={16} className="lp-footer-item" /></a>}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────── */}
      <section id="contact" style={{ padding: '100px 6%', background: 'var(--bg-card)' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 80,
          background: 'var(--bg-main)', borderRadius: 40, border: '1px solid var(--border)',
          overflow: 'hidden', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.05)'
        }}>
          <div style={{ padding: '60px', background: 'var(--primary)', color: 'white' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: 20, letterSpacing: '-0.02em' }}>{L.contact_title}</h2>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: 48, lineHeight: 1.6 }}>{L.contact_sub}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 14 }}><Mail size={24} /></div>
                <div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase' }}>{L.contact_email}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>no.codescreen@gmail.com</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 14 }}><Phone size={24} /></div>
                <div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase' }}>{L.contact_phone}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>+243 891 755 172</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 14 }}><MapPin size={24} /></div>
                <div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase' }}>{L.contact_location}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Matadi, RD Congo</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '60px' }}>
            <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>{L.contact_name}</label>
                  <input
                    type="text"
                    required
                    value={contactForm.nom}
                    onChange={e => setContactForm({ ...contactForm, nom: e.target.value })}
                    style={{ padding: '14px 18px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 600 }}
                    placeholder={L.contact_ph_name}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>{L.contact_email_label}</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                    style={{ padding: '14px 18px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 600 }}
                    placeholder={L.contact_ph_email}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>{L.contact_message}</label>
                <textarea
                  rows={4}
                  required
                  value={contactForm.message}
                  onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                  style={{ padding: '14px 18px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 600, resize: 'none' }}
                  placeholder={L.contact_ph_message}
                />
              </div>
              <button
                type="submit"
                disabled={sendingContact}
                style={{
                  background: 'var(--text-main)', color: 'var(--bg-main)', border: 'none',
                  padding: '16px', borderRadius: 12, fontWeight: 900, fontSize: '1rem',
                  cursor: sendingContact ? 'not-allowed' : 'pointer', transition: 'transform 0.2s',
                  opacity: sendingContact ? 0.7 : 1
                }}
              >
                {sendingContact ? (language === 'fr' ? 'Envoi...' : 'Sending...') : L.contact_send}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────── */}
      <section style={{ padding: '100px 6%' }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          style={{
            borderRadius: 32,
            background: 'linear-gradient(135deg, rgba(123, 125, 245, 0.8) 0%, rgba(138, 102, 223, 0.8) 50%, rgba(168,85,247,0.8) 80%), url(https://res.cloudinary.com/dq8o5yenr/image/upload/v1778192954/dlbkn6gyzggzzqql8zq5.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: 'clamp(48px, 7vw, 80px)',
            textAlign: 'center',
            boxShadow: '0 40px 80px -20px rgba(119, 121, 223, 0.38)',
            position: 'relative', overflow: 'hidden',
          }}>
          {/* BG decoration */}
          <div style={{
            position: 'absolute', top: -60, right: -60, width: 300, height: 300,
            borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute', bottom: -80, left: -40, width: 250, height: 250,
            borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none'
          }} />

          <Sparkles size={36} color="rgba(255,255,255,0.6)" style={{ marginBottom: 20 }} />
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 950, color: 'white', marginBottom: 16, letterSpacing: '-0.02em' }}>
            {L.cta_title}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem', marginBottom: 40, fontWeight: 500, maxWidth: 520, margin: '0 auto 36px' }}>
            {L.cta_sub}
          </p>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '16px 40px', borderRadius: 14, background: 'white',
              color: '#6366f1', border: 'none', fontWeight: 900, cursor: 'pointer',
              fontSize: '1rem', boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              display: 'inline-flex', alignItems: 'center', gap: 10,
              transition: 'all 0.25s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {L.cta_btn} <ArrowRight size={18} />
          </button>
        </motion.div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        background: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.02)',
        padding: '72px 6% 40px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1.6fr', gap: 48, marginBottom: 56, flexWrap: 'wrap' }}>
          {/* Brand */}
          <div>
            <Logo size={36} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.65, marginTop: 18, fontWeight: 500, maxWidth: 320 }}>
              {language === 'fr'
                ? 'La plateforme de gestion commerciale tout-en-un, conçue pour les entrepreneurs ambitieux.'
                : 'The all-in-one business management platform, built for ambitious entrepreneurs.'}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 style={{ fontWeight: 800, marginBottom: 20, color: 'var(--text-main)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {L.footer_product}
            </h4>
            <ul className="lp-footer-list">
              <li><a href="#features" className="lp-footer-item" style={{ textDecoration: 'none', display: 'block' }}>{L.footer_f1}</a></li>
              <li><a href="#multi-magasins" className="lp-footer-item" style={{ textDecoration: 'none', display: 'block' }}>{L.footer_f2}</a></li>
              <li><a href="#analytiques" className="lp-footer-item" style={{ textDecoration: 'none', display: 'block' }}>{L.footer_f3}</a></li>
              <li><a href="#securite" className="lp-footer-item" style={{ textDecoration: 'none', display: 'block' }}>{L.footer_f4}</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontWeight: 800, marginBottom: 20, color: 'var(--text-main)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {L.footer_company}
            </h4>
            <ul className="lp-footer-list">
              <li className="lp-footer-item" onClick={() => handleFooterLink(L.footer_c1, 'LUMO a été créé pour simplifier le commerce physique et en ligne des petites et moyennes entreprises.', 'LUMO was created to simplify physical and online commerce for small and medium businesses.')}>{L.footer_c1}</li>
              <li className="lp-footer-item" onClick={() => handleFooterLink(L.footer_c2, `Besoin d'aide ? Contactez-nous à no.codescreen@gmail.com ou au +243 00 000 000.`, `Need help? Contact us at no.codescreen@gmail.com or +243 00 000 000.`)}>{L.footer_c2}</li>
              <li className="lp-footer-item" onClick={() => handleFooterLink(L.footer_c3, 'Nous ne revendons jamais vos informations. Découvrez comment nous sécurisons vos données.', 'We never sell your informations. Read how we keep your data safe.')}>{L.footer_c3}</li>
              <li className="lp-footer-item" onClick={() => handleFooterLink(L.footer_c4, 'L’utilisation de LUMO est soumise à nos conditions générales d’utilisation.', 'The use of LUMO is bound by our general terms of service.')}>{L.footer_c4}</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 style={{ fontWeight: 800, marginBottom: 10, color: 'var(--text-main)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {L.news_title}
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 18, fontWeight: 500, lineHeight: 1.6 }}>
              {L.news_sub}
            </p>
            <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 8 }}>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={L.news_placeholder}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12,
                  background: 'var(--bg-main)', border: '1.5px solid var(--border)',
                  color: 'var(--text-main)', outline: 'none', fontSize: '0.88rem', fontWeight: 600,
                  transition: 'border 0.2s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
              <button
                type="submit" disabled={status === 'loading'}
                style={{
                  padding: '12px 18px', borderRadius: 12, background: 'var(--primary)',
                  color: 'white', border: 'none', cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  fontWeight: 800, fontSize: '0.88rem', opacity: status === 'loading' ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                }}
              >
                {status === 'loading' ? <Loader2 size={16} className="lp-spin" /> : L.news_btn}
              </button>
            </form>
            <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
              <a href="https://web.facebook.com/rcdevui" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}><Facebook size={20} className="lp-footer-item" /></a>
              <a href="https://www.linkedin.com/in/ren%C3%A9-nzaku-1b7413408/" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}><Linkedin size={20} className="lp-footer-item" /></a>
              <a href="https://x.com/rendevui" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}><Twitter size={20} className="lp-footer-item" /></a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          paddingTop: 24, borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', fontWeight: 600 }}>
              © {new Date().getFullYear()} LUMO AIO. {L.footer_copy}
            </p>

          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={12} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.83rem', fontWeight: 600 }}>
              {language === 'fr' ? 'Données sécurisées & chiffrées' : 'Secured & encrypted data'}
            </span>
          </div>
        </div>
      </footer>

      {/* ── CHAT WIDGET (LUMO AI LIVE) ────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 30, right: 90, zIndex: 1000 }}>
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              style={{
                position: 'absolute', bottom: 70, right: 0, width: 350, height: 450,
                background: 'var(--bg-card)', borderRadius: 24, border: '1.5px solid var(--border)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden',
                display: 'flex', flexDirection: 'column'
              }}
            >
              {/* Header */}
              <div style={{ background: 'var(--primary)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>LUMO Assistant</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{language === 'fr' ? 'En ligne' : 'Online'}</div>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {chatMessages.map((m, i) => (
                  <div key={i} style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: m.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                    background: m.role === 'user' ? 'var(--primary)' : 'var(--bg-main)',
                    color: m.role === 'user' ? 'white' : 'var(--text-main)',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: m.role === 'user' ? 'none' : '1px solid var(--border)'
                  }}>
                    {m.content}
                  </div>
                ))}
                {isTyping && (
                  <div style={{ alignSelf: 'flex-start', background: 'var(--bg-main)', padding: '12px 16px', borderRadius: '18px 18px 18px 2px', border: '1px solid var(--border)' }}>
                    <Loader2 size={16} className="lp-spin" color="var(--primary)" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                    placeholder={language === 'fr' ? 'Posez une question...' : 'Ask a question...'}
                    style={{ width: '100%', padding: '12px 48px 12px 16px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
                  />
                  <button onClick={handleSendChat} style={{ position: 'absolute', right: 8, top: 8, width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => setChatOpen(!chatOpen)}
          style={{
            width: 60, height: 60, borderRadius: '50%', background: 'var(--primary)',
            color: 'white', border: 'none', boxShadow: '0 10px 25px rgba(99,102,241,0.4)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <MessageSquare size={28} />
        </motion.button>
      </div>

      {/* ── COOKIE BANNER ──────────────────────────────────────── */}
      <AnimatePresence>
        {showCookie && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            style={{
              position: 'fixed', bottom: 30, left: 30, right: 30, maxWidth: 600,
              background: 'var(--bg-card)', padding: '20px 30px', borderRadius: 20,
              border: '1.5px solid var(--border)', boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
              zIndex: 2000, display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: 'var(--primary)15', padding: 10, borderRadius: 12 }}><ShieldCheck size={24} color="var(--primary)" /></div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4 }}>
                {language === 'fr'
                  ? 'Nous utilisons des cookies pour améliorer votre expérience sur LUMO.'
                  : 'We use cookies to improve your experience on LUMO.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="lp-btn-primary" onClick={acceptCookies}>{language === 'fr' ? 'Accepter' : 'Accept'}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GLOBAL STYLES ─────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .lp-link {
          color: var(--text-muted); font-weight: 700; font-size: 0.88rem;
          text-decoration: none; transition: color 0.2s;
        }
        .lp-link:hover { color: var(--primary); }

        .lp-icon-btn {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--bg-card); border: 1.5px solid var(--border);
          color: var(--text-main); display: flex; align-items: center;
          justify-content: center; cursor: pointer; transition: all 0.2s;
        }
        .lp-icon-btn:hover { border-color: var(--primary); color: var(--primary); }

        .lp-btn-primary {
          padding: 10px 22px; border-radius: 12px; background: var(--primary);
          color: white; border: none; font-weight: 800; cursor: pointer;
          font-size: 0.88rem; line-height: 1; transition: all 0.25s;
          display: inline-flex; align-items: center;
        }
        .lp-btn-primary:hover { box-shadow: 0 8px 24px rgba(99,102,241,0.4); transform: translateY(-2px); }

        .lp-btn-ghost {
          padding: 10px 22px; border-radius: 12px;
          background: var(--bg-card); border: 1.5px solid var(--border);
          color: var(--text-main); font-weight: 700; cursor: pointer;
          font-size: 0.88rem; line-height: 1; transition: all 0.25s;
          display: inline-flex; align-items: center;
        }
        .lp-btn-ghost:hover { border-color: var(--primary); color: var(--primary); }

        .lp-btn-lg { padding: 16px 34px; font-size: 1rem; border-radius: 14px; }

        .lp-badge {
          display: inline-flex; align-items: center;
          padding: 7px 16px; border-radius: 99px;
          background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2);
          color: var(--primary); font-weight: 800; font-size: 0.78rem;
          letter-spacing: 0.02em;
        }

        .lp-section-eyebrow {
          display: inline-block; padding: 5px 14px; border-radius: 99px;
          background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2);
          color: var(--primary); font-weight: 800; font-size: 0.75rem;
          letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 16px;
        }

        .lp-section-title {
          font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 950;
          letter-spacing: -0.03em; line-height: 1.15; color: var(--text-main);
          margin: 0 auto 16px auto; max-width: 700px;
        }

        .lp-section-sub {
          font-size: 1.05rem; color: var(--text-muted); font-weight: 500;
          max-width: 560px; margin: 0 auto; line-height: 1.65;
        }

        /* ── RESPONSIVE SPLIT SHOWCASE ── */
        .lp-feature-split {
          display: flex;
          align-items: center;
          gap: 60px;
        }

        .lp-feature-split.reverse {
          flex-direction: row-reverse;
        }

        .lp-split-text {
          flex: 1;
        }

        .lp-split-image {
          flex: 1.1;
          border-radius: 28px;
          overflow: hidden;
          border: 1.5px solid var(--border);
          box-shadow: 0 40px 80px -10px rgba(0,0,0,0.2);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .lp-split-image:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: var(--primary);
        }

        .lp-split-image img {
          width: 100%;
          display: block;
          object-fit: cover;
        }

        .lp-glass-overlay {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%);
        }

        .lp-feature-eyebrow {
          display: inline-block; padding: 6px 18px; border-radius: 99px;
          font-weight: 800; font-size: 0.8rem;
          letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 24px;
          border: 1px solid transparent;
        }

        .lp-split-title {
          font-size: clamp(2rem, 3.5vw, 2.8rem);
          font-weight: 950;
          line-height: 1.15;
          margin-bottom: 20px;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }

        .lp-split-desc {
          font-size: 1.1rem;
          color: var(--text-muted);
          line-height: 1.65;
          margin-bottom: 36px;
          font-weight: 500;
        }

        .lp-split-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .lp-split-list li {
          display: flex;
          align-items: center;
          gap: 14px;
          font-weight: 700;
          color: var(--text-main);
          font-size: 1.05rem;
        }

        .lp-screen-card {
          border-radius: 20px; overflow: hidden;
          border: 1.5px solid var(--border);
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          transition: transform 0.3s, box-shadow 0.3s;
          position: relative;
        }
        .lp-screen-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.18);
        }

        .lp-screen-label {
          position: absolute; top: 12px; left: 12px; z-index: 2;
          padding: 4px 12px; border-radius: 99px;
          background: rgba(10,10,20,0.7); backdrop-filter: blur(8px);
          color: white; font-weight: 700; font-size: 0.75rem;
        }

        .lp-feature-card {
          padding: 32px; border-radius: 20px;
          background: var(--bg-card); border: 1.5px solid var(--border);
          transition: all 0.3s; cursor: default;
        }
        .lp-feature-card:hover { border-color: var(--primary); box-shadow: 0 12px 40px rgba(99,102,241,0.12); }

        .lp-feature-icon {
          width: 52px; height: 52px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
        }

        .lp-footer-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 12px; }
        .lp-footer-item { color: var(--text-muted); font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: color 0.2s; }
        .lp-footer-item:hover { color: var(--primary); }

        .lp-spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .lp-pulse-dot { animation: pulseDot 2s ease-in-out infinite; }
        @keyframes pulseDot { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }

        html { scroll-behavior: smooth; }

        /* Responsive overrides REMOVED to force desktop mode everywhere */
      `}</style>
    </div>
  );
}


