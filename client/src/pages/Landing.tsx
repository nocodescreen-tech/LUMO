import { useTranslation } from '../hooks/useTranslation';
import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, BarChart3, CheckCircle2, ChevronDown,
  Cpu, Globe, Loader2, Moon, Package, ShieldCheck,
  ShoppingCart, Sparkles, Sun, TrendingUp, Users, Zap,
  Menu, X, Star, DollarSign, Activity, Lock, ChevronUp, Check, MessageSquare, Smartphone, Mail, Phone, MapPin,
  Facebook, Instagram, Linkedin, Twitter, Calculator, Heart, Send, Bell
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
    showcase_eyebrow: 'En Détail',
    feat_title: 'Tout ce dont vous avez besoin',
    feat_sub: 'Un écosystème complet pour piloter votre commerce au quotidien.',
    features_eyebrow: 'Modules',
    feat1_title: 'Caisse (POS) Rapide',
    feat1_desc: 'Terminal de vente ultra-réactif, multi-devises, avec panier, gestion des retours et impression de reçus.',
    feat2_title: 'Dashboard Intelligent',
    feat2_desc: 'Visualisez votre CA, marges et tendances en temps réel grâce à des graphiques dynamiques.',
    feat3_title: 'Stock & Inventaire',
    feat3_desc: 'Suivi précis des stocks, alertes de rupture, gestion des fournisseurs et calcul automatique des marges.',
    feat4_title: 'Multi-Devises',
    feat4_desc: 'Travaillez en USD, CDF avec des conversions instantanées et des rapports multi-monnaies.',
    feat5_title: 'Analyses Avancées',
    feat5_desc: 'Rapports détaillés sur vos ventes, exports Excel et analyses par catégorie sur 7 ou 30 jours.',
    feat6_title: 'Sécurisé & Fiable',
    feat6_desc: 'Données chiffrées, sauvegardes automatiques et contrôle des accès par rôle utilisateur.',
    ai_badge: 'Intelligence Artificielle',
    ai_title: "Analysé par l'IA, décidé par vous.",
    ai_sub: "L'assistant Lumo analyse vos données et vous propose des insights actionnables pour maximiser votre rentabilité.",
    ai_p1: "Prédictions de ventes basées sur vos historiques",
    ai_p2: "Alertes de stock intelligentes avant rupture",
    ai_p3: "Rapports automatiques exportables en Excel",
    ai_p4: "Analyse de la rentabilité produit et marge",
    ai_quote: '"Vos ventes de la semaine ont augmenté de 18%. Le produit Casque X-5 est en rupture imminente — commandez 30 unités pour maintenir la dynamique."',
    ai_chip_revenue: '+18% CA',
    ai_chip_stock: 'Stock critique',
    ai_chip_report: 'Rapport prêt',
    cta_title: 'Prêt à transformer votre business ?',
    cta_sub: "Rejoignez des commerçants qui font confiance à LUMO chaque jour. Configuration en moins de 5 minutes.",
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
    footer_copy: 'Tous droits réservés.',
    trusted_by: 'Ils nous font confiance au quotidien',
    testi_title: 'Ce que disent nos clients',
    testi_sub: 'Rejoignez la révolution LUMO avec des centaines d\'entrepreneurs satisfaits.',
    faq_title: 'Questions Fréquentes',
    faq_sub: 'Tout ce que vous devez savoir sur LUMO.',
    faq_eyebrow: 'FAQ',
    vs_title: 'LUMO vs Gestion Classique',
    vs_sub: 'Pourquoi passer à la nouvelle génération ?',
    vs_eyebrow: 'Comparaison',
    vs_lumo: 'Avec LUMO',
    vs_classic: 'Gestion Classique',
    hiw_title: 'Comment ça marche ?',
    hiw_sub: "De l'inscription à la première vente en moins de 5 minutes.",
    hiw_eyebrow: 'Processus rapide',
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
    mobile_notification_label: 'NOTIFICATION',
    mobile_notification_text: 'Nouvelle vente ! +450.00$',
    contact_title: 'Une question ? Parlez-nous',
    contact_sub: 'Notre équipe de support est là pour vous accompagner dans la digitalisation de votre commerce.',
    contact_email: 'no.codescreen@gmail.com',
    contact_phone: '+243 891 755 172',
    contact_location: 'Matadi, RD Congo',
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
    team_role_1: 'Architecte Principal & Fondateur',
    team_role_2: 'Testeur UI',
    contact_name: 'Nom',
    contact_email_label: 'Email',
    contact_message: 'Message',
    contact_ph_name: 'Votre nom',
    contact_ph_email: 'votre@email.com',
    contact_ph_message: 'Comment pouvons-nous vous aider ?',
    contact_send: 'Envoyer le message',
    cookie_banner_text: "Nous utilisons des cookies pour améliorer votre expérience et analyser notre trafic.",
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
    testi_text3: "Une interface magnifique, rapide et très intuitive. J'ai formé mes caissiers en moins de 15 minutes. Une vraie révolution.",
    mobile_eyebrow: 'Mobile',
    cookie_accept_btn: "Accepter",
    vs_col_feature: 'Fonctionnalité',
    chat_online: 'En ligne',
    chat_placeholder: 'Posez une question...',
    chat_greeting: "Bonjour ! Je suis LUMO. Comment puis-je vous aider aujourd'hui ?",
    chat_error: 'Erreur de connexion avec LUMO.',
    contact_success: 'Message envoyé avec succès !',
    contact_error: "Erreur lors de l'envoi.",
    contact_fields_required: 'Veuillez remplir tous les champs.',
    contact_sending: 'Envoi...',
    roi_eyebrow: 'Calculateur ROI',
    footer_close: 'Fermer',
    footer_brand_desc: 'La plateforme de gestion commerciale tout-en-un, conçue pour les entrepreneurs ambitieux.',
    footer_secure_data: 'Données sécurisées & chiffrées',
    faq_q1: 'Puis-je utiliser LUMO sans connexion internet ?',
    faq_a1: 'Oui ! Notre application possède un mode hors-ligne. Vous pouvez continuer à vendre, et les données se synchroniseront automatiquement dès que la connexion sera rétablie.',
    faq_q2: 'Comment fonctionne la gestion multi-devises ?',
    faq_a2: "Vous définissez votre taux de change. Lors d'une vente, vous pouvez encaisser en Francs Congolais ou en Dollars, et le système calcule automatiquement le rendu de la monnaie et met à jour votre caisse.",
    faq_q3: 'Mes données sont-elles sécurisées ?',
    faq_a3: 'Absolument. Vos données sont chiffrées et nous effectuons des sauvegardes automatiques plusieurs fois par jour sur des serveurs sécurisés.',
    faq_q4: 'Ai-je besoin de matériel spécial ?',
    faq_a4: "Non, LUMO fonctionne sur n'importe quel ordinateur, tablette ou smartphone. Nous supportons également la majorité des lecteurs de codes-barres et imprimantes thermiques Bluetooth/USB.",
    showcase_dash_title: 'Pleine visibilité sur votre activité.',
    showcase_dash_desc: 'Gardez un œil sur votre chiffre d\'affaires, vos marges et votre croissance en temps réel. Des graphiques clairs et une interface épurée pour prendre les meilleures décisions sans stress.',
    showcase_dash_li1: 'Suivi financier en temps réel',
    showcase_dash_li2: 'Indicateurs clés de performance (KPI)',
    showcase_dash_li3: 'Comparaison et évolution des périodes',
    showcase_stock_title: 'Gestion d\'inventaire intelligente.',
    showcase_stock_desc: 'Ne perdez plus le fil de votre stock. Suivez vos niveaux précisément, recevez des alertes automatiques avant les ruptures, et gérez vos approvisionnements chez vos fournisseurs en quelques clics.',
    showcase_stock_li1: 'Alertes préventives de stock bas',
    showcase_stock_li2: 'Calcul de marge bénéficiaire exact',
    showcase_stock_li3: 'Historique complet des mouvements',
    showcase_pos_title: 'Point de Vente Ultra-Rapide.',
    showcase_pos_desc: 'Conçu pour la fluidité au comptoir physique. Traitez vos ventes en devises multiples, encaissez en scanning de codes-barres et imprimez vos factures thermiques instantanément.',
    showcase_pos_li1: 'Prise en charge intégrale des scanners',
    showcase_pos_li2: 'Paiement mixte et Multi-devises',
    showcase_pos_li3: 'Génération de tickets rapide',
    showcase_analytics_title: 'Des données brutes aux décisions.',
    showcase_analytics_desc: 'Extrayez tout le potentiel de votre boutique. Exportez vos données vers Excel, visualisez quels produits performent le mieux, et suivez l\'efficacité de chaque vendeur dans votre équipe.',
    showcase_analytics_li1: 'Exports Excel natifs en 1 clic',
    showcase_analytics_li2: 'Identification des produits stars',
    showcase_analytics_li3: 'Classement des performances vendeurs',
    security_title: 'Sécurité Avancée',
    security_desc: 'Nous prenons la sécurité de vos données au sérieux. Tout est chiffré, scellé et sauvegardé automatiquement. Aucun compromis.',
    security_li1: 'Chiffrement AES-256 de bout en bout',
    security_li2: 'Sauvegardes automatiques sans perte',
    security_li3: 'Protection Rate Limiting anti-bruteforce',
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
    showcase_eyebrow: 'In detail',
    feat_title: 'Everything you need',
    feat_sub: 'A complete ecosystem to manage your business every day.',
    features_eyebrow: 'Modules',
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
    faq_eyebrow: 'FAQ',
    vs_title: 'LUMO vs Classic Management',
    vs_sub: 'Why switch to the next generation?',
    vs_eyebrow: 'Comparison',
    vs_lumo: 'With LUMO',
    vs_classic: 'Classic Management',
    hiw_title: 'How does it work?',
    hiw_sub: 'From sign up to your first sale in less than 5 minutes.',
    hiw_eyebrow: 'Fast process',
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
    mobile_notification_label: 'NOTIFICATION',
    mobile_notification_text: 'New sale! +450.00$',
    contact_title: 'Have a question? Talk to us',
    contact_sub: 'Our support team is here to help you digitize your business.',
    contact_email: 'no.codescreen@gmail.com',
    contact_phone: '+243 891 755 172',
    contact_location: 'Matadi, DRC',
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
    team_sub: 'A passionate team dedicated to the success of African merchants.',
    team_role_1: 'Lead Architect & Founder',
    team_role_2: 'UI Tester',
    contact_name: 'Name',
    contact_email_label: 'Email',
    contact_message: 'Message',
    contact_ph_name: 'Your name',
    contact_ph_email: 'your@email.com',
    contact_ph_message: 'How can we help you?',
    contact_send: 'Send message',
    cookie_banner_text: "We use cookies to enhance your experience and analyze our traffic.",
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
    mobile_eyebrow: 'Mobile',
    cookie_accept_btn: "Accept",
    vs_col_feature: 'Feature',
    chat_online: 'Online',
    chat_placeholder: 'Ask a question...',
    chat_greeting: 'Hello! I am LUMO. How can I help you today?',
    chat_error: 'Connection error with LUMO.',
    contact_success: 'Message sent successfully!',
    contact_error: 'Error sending message.',
    contact_fields_required: 'Please fill all fields.',
    contact_sending: 'Sending...',
    roi_eyebrow: 'ROI Calculator',
    footer_close: 'Close',
    footer_brand_desc: 'The all-in-one business management platform, built for ambitious entrepreneurs.',
    footer_secure_data: 'Secured & encrypted data',
    faq_q1: 'Can I use LUMO without internet?',
    faq_a1: 'Yes! Our app has an offline mode. You can keep selling, and data will sync automatically once connection is back.',
    faq_q2: 'How does multi-currency management work?',
    faq_a2: 'You set your exchange rate. During a sale, you can checkout in Congolese Francs or Dollars, and the system automatically calculates change and updates your cash.',
    faq_q3: 'Is my data secure?',
    faq_a3: 'Absolutely. Your data is encrypted and we perform automatic backups several times a day on secure servers.',
    faq_q4: 'Do I need special hardware?',
    faq_a4: 'No, LUMO works on any computer, tablet or smartphone. We also support most barcode scanners and Bluetooth/USB thermal printers.',
    showcase_dash_title: 'Full visibility on your business.',
    showcase_dash_desc: 'Keep an eye on your revenue, margins, and growth in real time. Clear charts and a clean interface to make the best decisions stress-free.',
    showcase_dash_li1: 'Real-time financial tracking',
    showcase_dash_li2: 'Key Performance Indicators (KPI)',
    showcase_dash_li3: 'Period evolution and comparison',
    showcase_stock_title: 'Smart Inventory Management.',
    showcase_stock_desc: 'Never lose track of your stock. Track levels accurately, receive automatic alerts before shortages, and manage supplier restocks in a few clicks.',
    showcase_stock_li1: 'Preventive low stock alerts',
    showcase_stock_li2: 'Exact profit margin calculation',
    showcase_stock_li3: 'Complete movement history',
    showcase_pos_title: 'Lightning-Fast Point of Sale.',
    showcase_pos_desc: 'Built for physical counter fluidity. Process sales in multiple currencies, checkout with barcode scanning and print thermal receipts instantly.',
    showcase_pos_li1: 'Full barcode scanner support',
    showcase_pos_li2: 'Mixed and Multi-currency payments',
    showcase_pos_li3: 'Fast receipt generation',
    showcase_analytics_title: 'From raw data to decisions.',
    showcase_analytics_desc: 'Extract full potential from your store. Export your data to Excel, view which products perform best, and track the efficiency of each salesman.',
    showcase_analytics_li1: '1-click native Excel exports',
    showcase_analytics_li2: 'Star products identification',
    showcase_analytics_li3: 'Staff performance leaderboard',
    security_title: 'Advanced Security',
    security_desc: 'We take your data security seriously. Everything is encrypted, sealed, and automatically backed up. No compromises.',
    security_li1: 'AES-256 end-to-end encryption',
    security_li2: 'Zero-loss automatic backups',
    security_li3: 'Anti-bruteforce Rate Limiting protection',
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
function AnimatedCounter({ value, duration = 2, decimals = 0 }: { value: number, duration?: number, decimals?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{count.toFixed(decimals).replace('.', ',')}</>;
}

// ─── Component ────────────────────────────────────────────────────────────────
// ─── Component: Landing "Terre & Fleuve" ────────────────────────────────────
export default function Landing() {
  const { theme, setTheme, language, setLanguage } = useAuthStore();
  const navigate = useNavigate();
  const L = i18n[language] || i18n.fr;
  const isDark = theme === 'dark';
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const { status, subscribe } = useNewsletter();
  const { scrollYProgress } = useScroll();
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
    }).catch(() => { });
  }, []);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.nom || !contactForm.email || !contactForm.message) {
      toast.error(L.contact_fields_required);
      return;
    }
    setSendingContact(true);
    try {
      await api.post('/contact', contactForm);
      toast.success(L.contact_success);
      setContactForm({ nom: '', email: '', message: '' });
    } catch (err) {
      toast.error(L.contact_error);
    } finally {
      setSendingContact(false);
    }
  };

  // --- Savings Calculator ---
  const [salesPerDay, setSalesPerDay] = useState(20);
  const [avgBasket, setAvgBasket] = useState(15000);
  const [timeSaved, setTimeSaved] = useState(0);
  const [moneySaved, setMoneySaved] = useState(0);
  useEffect(() => {
    const minutesSaved = salesPerDay * 8;
    const monthlyHours = (minutesSaved * 26) / 60;
    setTimeSaved(Math.round(monthlyHours));
    const monthlyTurnover = salesPerDay * avgBasket * 26;
    setMoneySaved(Math.round(monthlyTurnover * 0.05));
  }, [salesPerDay, avgBasket]);

  // --- Chat Widget (IA) ---
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: L.chat_greeting }
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
      toast.error(L.chat_error);
    } finally {
      setIsTyping(false);
    }
  };
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  useEffect(() => {
    setChatMessages(prev => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ role: 'assistant', content: L.chat_greeting }];
      }
      return prev;
    });
  }, [language]);

  // --- Cookie Banner ---
  const [showCookie, setShowCookie] = useState(!localStorage.getItem('lumo_cookies_accepted'));
  const acceptCookies = () => {
    localStorage.setItem('lumo_cookies_accepted', 'true');
    setShowCookie(false);
  };

  // --- Footer Modal ---
  const [footerModal, setFooterModal] = useState<{ open: boolean; title: string; content: string }>({ open: false, title: '', content: '' });
  const handleFooterLink = (title: string, contentFr: string, contentEn: string) => {
    setFooterModal({ open: true, title, content: language === 'fr' ? contentFr : contentEn });
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    await subscribe(email, language);
  };
  useEffect(() => {
    if (status === 'ok') setEmail('');
  }, [status]);

  const features = [
    { icon: ShoppingCart, color: 'var(--fleuve)', title: L.feat1_title, desc: L.feat1_desc },
    { icon: BarChart3, color: 'var(--terre)', title: L.feat2_title, desc: L.feat2_desc },
    { icon: Package, color: 'var(--or)', title: L.feat3_title, desc: L.feat3_desc },
    { icon: Globe, color: 'var(--fleuve)', title: L.feat4_title, desc: L.feat4_desc },
    { icon: TrendingUp, color: 'var(--terre)', title: L.feat5_title, desc: L.feat5_desc },
    { icon: ShieldCheck, color: 'var(--or)', title: L.feat6_title, desc: L.feat6_desc },
  ];

  const splits = [
    { img: '/screen4.png', alt: 'Dashboard LUMO', eyebrow: L.eyebrow_dashboard, title: L.showcase_dash_title, desc: L.showcase_dash_desc, li: [L.showcase_dash_li1, L.showcase_dash_li2, L.showcase_dash_li3], reverse: false },
    { img: '/screen2.png', alt: 'Stock LUMO', eyebrow: L.eyebrow_stock, title: L.showcase_stock_title, desc: L.showcase_stock_desc, li: [L.showcase_stock_li1, L.showcase_stock_li2, L.showcase_stock_li3], reverse: true },
    { img: '/screen5.png', alt: 'POS LUMO', eyebrow: L.eyebrow_pos, title: L.showcase_pos_title, desc: L.showcase_pos_desc, li: [L.showcase_pos_li1, L.showcase_pos_li2, L.showcase_pos_li3], reverse: false },
    { img: '/screen1.png', alt: 'Analytiques LUMO', eyebrow: L.eyebrow_analytics, title: L.showcase_analytics_title, desc: L.showcase_analytics_desc, li: [L.showcase_analytics_li1, L.showcase_analytics_li2, L.showcase_analytics_li3], reverse: true },
  ];

  const steps = [
    { n: '01', title: L.hiw_step1, desc: L.hiw_step1_desc },
    { n: '02', title: L.hiw_step2, desc: L.hiw_step2_desc },
    { n: '03', title: L.hiw_step3, desc: L.hiw_step3_desc },
  ];

  const testimonials = [
    { text: L.testi_text1, role: L.testi_role1 },
    { text: L.testi_text2, role: L.testi_role2 },
    { text: L.testi_text3, role: L.testi_role3 },
  ];

  const team = [];

  const faqs = [
    { q: L.faq_q1, a: L.faq_a1 },
    { q: L.faq_q2, a: L.faq_a2 },
    { q: L.faq_q3, a: L.faq_a3 },
    { q: L.faq_q4, a: L.faq_a4 },
  ];

  const vsRows = [L.vs_row1, L.vs_row2, L.vs_row3, L.vs_row4, L.vs_row5, L.vs_row6];

  return (
    <div className="lp-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:wght@400;600&display=swap');
        .lp-root {
          /* THÈME A — Terre & Fleuve clair, haute lisibilité (WCAG AA) */
          --bg: #F8F4EA; --surface: #FFFDF7; --ink: #17130C; --muted: #4C453A;
          --fleuve: #155E58; --fleuve-deep: #0F4A45; --terre: #A84420; --or: #A97411;
          --line: rgba(23,19,12,0.16); --chip: rgba(21,94,88,0.12);
          --shadow: 0 20px 60px -30px rgba(23,19,12,0.35);
          background: var(--bg); color: var(--ink); min-height: 100vh;
          font-family: 'Space Grotesk', system-ui, sans-serif;
          --font-serif: 'Fraunces', Georgia, serif; --font-mono: 'JetBrains Mono', monospace;
          overflow-x: clip;
          transition: background .3s, color .3s;
        }
        html[data-theme='dark'] .lp-root {
          /* Variante sombre (toggle) */
          --bg: #14100B; --surface: #201A12; --ink: #EDE3CE; --muted: #B5A98C;
          --fleuve: #46B0A7; --fleuve-deep: #2C7A73; --terre: #E0845A; --or: #E0A93D;
          --line: rgba(237,227,206,0.16); --chip: rgba(62,156,148,0.14);
          --shadow: 0 24px 70px -30px rgba(0,0,0,0.65);
        }
        * { box-sizing: border-box; }
        .lp-root .lp-container { max-width: 1180px; margin: 0 auto; padding: 0 24px; }
        .lp-eyebrow { font-family: var(--font-mono); font-size: 12px; letter-spacing: .22em; text-transform: uppercase; color: var(--fleuve); font-weight: 600; display: inline-flex; align-items: center; gap: 10px; }
        .lp-eyebrow::before { content: ''; width: 26px; height: 1px; background: var(--fleuve); display: inline-block; }
        .lp-title { font-family: var(--font-serif); font-weight: 600; letter-spacing: -0.02em; line-height: 1.05; font-size: clamp(2rem, 4.6vw, 3.4rem); margin: 14px 0 16px; }
        .lp-title em { font-style: italic; color: var(--terre); }
        .lp-sub { color: var(--muted); font-size: 1.12rem; line-height: 1.7; max-width: 640px; }
        .lp-band { padding: 96px 0; }
        .lp-stripes { background-image: repeating-linear-gradient(45deg, transparent 0 10px, rgba(31,111,107,0.05) 10px 11px); }
        .lp-stripes-terre { background-image: repeating-linear-gradient(-45deg, transparent 0 10px, rgba(196,85,45,0.06) 10px 11px); }
        .lp-btn { display: inline-flex; align-items: center; gap: 10px; font-family: var(--font-mono); font-size: 14px; font-weight: 600; letter-spacing: .04em; padding: 15px 26px; border-radius: 8px; cursor: pointer; border: 1px solid transparent; transition: all .3s cubic-bezier(0.25, 1, 0.5, 1); text-decoration: none; }
        .lp-btn-fleuve { background: var(--fleuve); color: #F5EFE3; box-shadow: 0 12px 30px -12px rgba(31,111,107,0.55); }
        .lp-btn-fleuve:hover { background: var(--fleuve-deep); transform: translateY(-2px); box-shadow: 0 16px 40px -12px rgba(31,111,107,0.7); }
        .lp-btn-ghost { border-color: var(--line); color: var(--ink); background: transparent; }
        .lp-btn-ghost:hover { border-color: var(--fleuve); color: var(--fleuve); }
        .lp-card { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; }
        .lp-progress { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 100; background: linear-gradient(90deg, var(--fleuve), var(--terre)); transform-origin: 0 50%; }
        /* Nav */
        .lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 90; background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(14px); border-bottom: 1px solid var(--line); }
        .lp-nav-inner { display: flex; align-items: center; justify-content: space-between; height: 72px; }
        .lp-nav-links { display: flex; align-items: center; gap: 30px; }
        .lp-nav-links a { color: var(--muted); text-decoration: none; font-size: 15px; transition: color .2s; }
        .lp-nav-links a:hover { color: var(--fleuve); }
        .lp-icon-btn { background: none; border: 1px solid var(--line); border-radius: 6px; color: var(--ink); width: 38px; height: 38px; display: grid; place-items: center; cursor: pointer; transition: all .2s; font-size: 15px; }
        .lp-icon-btn:hover { border-color: var(--fleuve); color: var(--fleuve); }
        /* Hero */
        .lp-hero { padding: 170px 0 60px; position: relative; }
        .lp-badge { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--fleuve); border: 1px solid var(--line); background: var(--surface); padding: 8px 16px; border-radius: 100px; }
        .lp-hero-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 60px; align-items: center; }
        .lp-hero h1 { font-family: var(--font-serif); font-weight: 600; letter-spacing: -0.03em; line-height: 1.02; font-size: clamp(2.7rem, 6vw, 4.6rem); margin: 26px 0 22px; }
        .lp-hero h1 em { font-style: italic; color: var(--terre); }
        .lp-hero .lp-hero-sub { color: var(--muted); font-size: 1.18rem; line-height: 1.75; max-width: 520px; }
        .lp-hero-btns { display: flex; gap: 14px; margin-top: 34px; flex-wrap: wrap; }
        .lp-hero-stats { display: flex; gap: 42px; margin-top: 54px; flex-wrap: wrap; border-top: 1px solid var(--line); padding-top: 30px; }
        .lp-hero-stat b { display: block; font-family: var(--font-serif); font-size: 1.9rem; font-weight: 600; color: var(--ink); }
        .lp-hero-stat > span { font-family: var(--font-mono); font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); }
        .lp-hero-visual { position: relative; }
        .lp-frame { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 12px; box-shadow: var(--shadow); }
        .lp-frame img { width: 100%; display: block; border-radius: 8px; }
        .lp-frame-bar { display: flex; gap: 6px; padding: 6px 8px 12px; }
        .lp-frame-bar i { width: 9px; height: 9px; border-radius: 50%; display: block; }
        .lp-frame-bar i:nth-child(1) { background: var(--terre); } .lp-frame-bar i:nth-child(2) { background: var(--or); } .lp-frame-bar i:nth-child(3) { background: var(--fleuve); }
        .lp-chip { position: absolute; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 10px 14px; font-family: var(--font-mono); font-size: 12px; box-shadow: var(--shadow); display: flex; align-items: center; gap: 8px; color: var(--ink); }
        .lp-chip b { color: var(--fleuve); font-size: 13px; }
        .lp-chip-1 { top: 30px; left: -30px; animation: floatY 5s ease-in-out infinite; }
        .lp-chip-2 { bottom: 40px; right: -26px; animation: floatY 6s ease-in-out infinite reverse; }
        .lp-chip-2 b { color: var(--terre); }
        @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        /* Trusted marquee */
        .lp-trusted { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 26px 0; overflow: hidden; }
        .lp-trusted p { text-align: center; font-family: var(--font-mono); font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: var(--muted); margin-bottom: 18px; }
        .lp-marquee { display: flex; gap: 44px; width: max-content; animation: marquee 26s linear infinite; font-family: var(--font-mono); font-size: 13px; color: var(--muted); }
        .lp-marquee span { display: inline-flex; align-items: center; gap: 44px; white-space: nowrap; }
        .lp-marquee i { color: var(--or); font-style: normal; font-size: 9px; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        /* Showcase splits */
        .lp-split { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
        .lp-split.reverse .lp-split-text { order: 2; } .lp-split.reverse .lp-split-visual { order: 1; }
        .lp-split-text h3 { font-family: var(--font-serif); font-size: clamp(1.5rem, 2.6vw, 2.1rem); font-weight: 600; letter-spacing: -0.02em; margin: 14px 0 12px; }
        .lp-split-text p { color: var(--muted); line-height: 1.7; font-size: 16.5px; }
        .lp-check-list { list-style: none; padding: 0; margin: 22px 0 0; display: grid; gap: 12px; }
        .lp-check-list li { display: flex; align-items: flex-start; gap: 12px; font-size: 16.5px; color: var(--ink); }
        .lp-check-list svg { color: var(--fleuve); flex-shrink: 0; margin-top: 2px; }
        .lp-split-visual { position: relative; }
        .lp-corner { position: absolute; width: 74px; height: 74px; border: 2px solid var(--terre); z-index: 2; pointer-events: none; }
        .lp-corner-tl { top: -14px; left: -14px; border-right: 0; border-bottom: 0; }
        .lp-corner-br { bottom: -14px; right: -14px; border-left: 0; border-top: 0; }
        /* Features grid */
        .lp-feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 54px; }
        .lp-feat { padding: 30px 26px; border-radius: 12px; transition: transform .25s, box-shadow .25s; }
        .lp-feat:hover { transform: translateY(-5px); box-shadow: var(--shadow); }
        .lp-feat-icon { width: 52px; height: 52px; border-radius: 10px; display: grid; place-items: center; margin-bottom: 18px; }
        .lp-feat h4 { font-family: var(--font-serif); font-size: 1.18rem; font-weight: 600; margin: 0 0 8px; }
        .lp-feat p { color: var(--muted); font-size: 16px; line-height: 1.65; margin: 0; }
        /* Steps */
        .lp-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 54px; counter-reset: step; }
        .lp-step { padding: 30px 26px; border-radius: 12px; position: relative; }
        .lp-step b { font-family: var(--font-mono); font-size: 12px; color: var(--fleuve); letter-spacing: .14em; }
        .lp-step h4 { font-family: var(--font-serif); font-size: 1.15rem; font-weight: 600; margin: 14px 0 8px; }
        .lp-step p { color: var(--muted); font-size: 16px; line-height: 1.6; margin: 0; }
        /* Multi-magasins band */
        .lp-empire { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 64px; text-align: center; position: relative; overflow: hidden; }
        .lp-empire::after { content: '◈'; position: absolute; right: 24px; bottom: -30px; font-size: 170px; color: var(--line); opacity: .5; font-family: var(--font-serif); }
        .lp-empire h2 { font-family: var(--font-serif); font-size: clamp(1.8rem, 3.6vw, 2.8rem); font-weight: 600; letter-spacing: -0.02em; margin: 16px auto 14px; max-width: 760px; }
        .lp-empire h2 em { font-style: italic; color: var(--terre); }
        .lp-empire p { color: var(--muted); max-width: 620px; margin: 0 auto; line-height: 1.7; }
        /* AI analytics */
        .lp-ai { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
        .lp-ai-panel { padding: 34px; border-radius: 14px; position: relative; }
        .lp-ai-quote { font-family: var(--font-serif); font-style: italic; font-size: 1.22rem; line-height: 1.6; margin: 18px 0 22px; }
        .lp-ai-chips { display: flex; gap: 10px; flex-wrap: wrap; }
        .lp-ai-chip { font-family: var(--font-mono); font-size: 12px; padding: 7px 13px; border-radius: 100px; display: inline-flex; align-items: center; gap: 7px; border: 1px solid var(--line); color: var(--ink); }
        .lp-ai-chip.green { background: var(--chip); border-color: rgba(31,111,107,0.25); color: var(--fleuve); }
        .lp-ai-chip.terre { background: rgba(196,85,45,0.08); border-color: rgba(196,85,45,0.25); color: var(--terre); }
        .lp-ai-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 16px; }
        .lp-ai-list li { display: flex; gap: 14px; align-items: flex-start; font-size: 16px; color: var(--muted); line-height: 1.6; }
        .lp-ai-list svg { color: var(--terre); flex-shrink: 0; margin-top: 3px; }
        .lp-ai-list b { color: var(--ink); font-weight: 600; }
        /* Mobile */
        .lp-mobile { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 70px; align-items: center; }
        .lp-phone { width: 270px; aspect-ratio: 9 / 19; margin: 0 auto; border-radius: 36px; border: 8px solid #0D0B08; background: var(--surface); overflow: hidden; position: relative; box-shadow: var(--shadow); }
        .lp-phone img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
        .lp-phone .lp-phone-notif { position: absolute; left: 10px; right: 10px; bottom: 12px; display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; box-shadow: 0 12px 30px -12px rgba(0,0,0,0.45); }
        .lp-phone .dot { width: 32px; height: 32px; border-radius: 8px; background: var(--chip); display: grid; place-items: center; color: var(--fleuve); flex-shrink: 0; }
        .lp-phone-notif b { display: block; font-family: var(--font-mono); font-size: 9px; letter-spacing: .14em; color: var(--terre); margin-bottom: 2px; }
        .lp-phone-notif span { font-size: 11.5px; color: var(--muted); line-height: 1.35; }
        .lp-mobile-list { list-style: none; padding: 0; margin: 26px 0 0; display: grid; gap: 14px; }
        .lp-mobile-list li { display: flex; align-items: center; gap: 13px; font-size: 16px; color: var(--ink); }
        .lp-mobile-list svg { color: var(--fleuve); flex-shrink: 0; }
        .lp-notif { margin-top: 26px; display: flex; align-items: center; gap: 14px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 14px 18px; box-shadow: var(--shadow); max-width: 400px; }
        .lp-notif .dot { width: 40px; height: 40px; border-radius: 10px; background: var(--chip); display: grid; place-items: center; color: var(--fleuve); flex-shrink: 0; }
        .lp-notif b { display: block; font-family: var(--font-mono); font-size: 10px; letter-spacing: .16em; color: var(--terre); margin-bottom: 3px; }
        .lp-notif span { font-size: 13px; color: var(--muted); }
        /* Security */
        .lp-sec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .lp-sec-card { padding: 40px; border-radius: 14px; position: relative; overflow: hidden; }
        .lp-sec-card::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(45deg, transparent 0 12px, rgba(237,227,206,0.04) 12px 13px); }
        .lp-sec-card h3 { font-family: var(--font-serif); font-size: 1.6rem; font-weight: 600; position: relative; }
        .lp-sec-card .big { font-family: var(--font-mono); font-size: 3.4rem; font-weight: 600; color: var(--or); position: relative; }
        .lp-sec-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 16px; }
        .lp-sec-list li { display: flex; gap: 14px; color: var(--muted); font-size: 16px; line-height: 1.6; align-items: flex-start; }
        .lp-sec-list svg { color: var(--or); flex-shrink: 0; margin-top: 3px; }
        .lp-sec-list b { color: var(--ink); }
        /* VS table */
        .lp-vs { margin-top: 54px; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: var(--surface); }
        .lp-vs-row { display: grid; grid-template-columns: 1.4fr 1fr 1fr; border-bottom: 1px solid var(--line); }
        .lp-vs-row:last-child { border-bottom: 0; }
        .lp-vs-row > div { padding: 18px 24px; font-size: 14.5px; display: flex; align-items: center; gap: 10px; }
        .lp-vs-row.head { background: #0E0C08; color: #EDE3CE; font-family: var(--font-mono); font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
        .lp-vs-row.head .ok { color: var(--or); }
        .lp-vs-row .feat { color: var(--muted); }
        .lp-vs-row .ok { color: var(--fleuve); font-weight: 600; }
        .lp-vs-row .no { color: var(--muted); opacity: .45; }
        /* Testimonials */
        .lp-testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 54px; }
        .lp-testi { padding: 30px 26px; border-radius: 12px; display: flex; flex-direction: column; gap: 18px; }
        .lp-testi .stars { display: flex; gap: 3px; color: var(--or); }
        .lp-testi p { color: var(--muted); font-size: 16.5px; line-height: 1.7; margin: 0; flex: 1; }
        .lp-testi .who { font-family: var(--font-mono); font-size: 12px; color: var(--ink); }
        .lp-testi .who span { color: var(--muted); display: block; margin-top: 2px; font-size: 11px; }
        /* Calculator */
        .lp-calc { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; align-items: center; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 54px; margin-top: 54px; }
        .lp-calc label { font-family: var(--font-mono); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); display: block; margin-bottom: 10px; }
        .lp-calc input[type=range] { width: 100%; accent-color: var(--fleuve); height: 26px; }
        .lp-calc .val { font-family: var(--font-mono); font-size: 15px; color: var(--fleuve); font-weight: 600; }
        .lp-result { border-top: 1px solid var(--line); padding-top: 26px; display: grid; gap: 16px; }
        .lp-result .res { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
        .lp-result .res span { color: var(--muted); font-size: 14px; }
        .lp-result .res b { font-family: var(--font-mono); font-size: 1.5rem; color: var(--terre); }
        /* Team */
        .lp-team-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 26px; margin-top: 54px; text-align: center; }
        .lp-team img { width: 150px; height: 150px; object-fit: cover; border-radius: 58% 42% 60% 40% / 50% 55% 45% 50%; border: 3px solid var(--terre); margin: 0 auto 20px; display: block; }
        .lp-team h4 { font-family: var(--font-serif); font-size: 1.15rem; font-weight: 600; margin: 0 0 4px; }
        .lp-team p { font-family: var(--font-mono); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin: 0 0 14px; }
        .lp-team .socials { display: flex; justify-content: center; gap: 10px; }
        .lp-team .socials a { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--line); display: grid; place-items: center; color: var(--muted); transition: all .2s; }
        .lp-team .socials a:hover { color: var(--fleuve); border-color: var(--fleuve); }
        /* FAQ */
        .lp-faq { max-width: 780px; margin: 54px auto 0; display: grid; gap: 12px; }
        .lp-faq-item { border: 1px solid var(--line); border-radius: 10px; background: var(--surface); overflow: hidden; }
        .lp-faq-q { width: 100%; background: none; border: 0; padding: 20px 22px; display: flex; justify-content: space-between; align-items: center; gap: 16px; cursor: pointer; color: var(--ink); font-size: 15px; font-weight: 600; font-family: 'Space Grotesk', sans-serif; text-align: left; }
        .lp-faq-q svg { color: var(--fleuve); flex-shrink: 0; transition: transform .3s; }
        .lp-faq-item.open .lp-faq-q svg { transform: rotate(180deg); }
        .lp-faq-a { color: var(--muted); font-size: 14.5px; line-height: 1.7; padding: 0 22px 20px; }
        /* Contact */
        .lp-contact-grid { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 50px; margin-top: 54px; align-items: start; }
        .lp-contact-info { display: grid; gap: 14px; }
        .lp-contact-info .row { display: flex; align-items: flex-start; gap: 18px; color: var(--muted); font-size: 16px; cursor: default; }
        .lp-contact-info .icon-box { width: 44px; height: 44px; border-radius: 12px; background: var(--chip); display: grid; place-items: center; flex-shrink: 0; color: var(--fleuve); transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1); }
        .lp-contact-info .row:hover .icon-box { transform: scale(1.1) rotate(5deg); }
        .lp-contact-info .row b { display: block; font-family: var(--font-mono); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--terre); margin-bottom: 3px; }
        .lp-contact-info .row span { color: var(--ink); font-size: 17px; font-weight: 600; word-break: break-word; line-height: 1.4; }
        .lp-form { display: grid; gap: 16px; padding: 34px; border-radius: 14px; }
        .lp-form input, .lp-form textarea { width: 100%; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 15px 16px; color: var(--ink); font-family: 'Space Grotesk', sans-serif; font-size: 16.5px; transition: border-color .2s; }
        .lp-form input:focus, .lp-form textarea:focus { outline: none; border-color: var(--fleuve); }
        .lp-form input::placeholder, .lp-form textarea::placeholder { color: var(--muted); opacity: .7; }
        .lp-form textarea { min-height: 130px; resize: vertical; }
        /* CTA */
        .lp-cta { background: linear-gradient(135deg, var(--fleuve-deep), var(--fleuve)); border-radius: 18px; padding: 80px 60px; text-align: center; color: #F5EFE3; position: relative; overflow: hidden; }
        .lp-cta::before { content: ''; position: absolute; inset: 0; background-image: repeating-linear-gradient(45deg, transparent 0 14px, rgba(255,255,255,0.05) 14px 15px); }
        .lp-cta h2 { font-family: var(--font-serif); font-size: clamp(2rem, 4.4vw, 3.2rem); font-weight: 600; letter-spacing: -0.02em; margin: 0 auto 16px; position: relative; max-width: 700px; }
        .lp-cta p { opacity: .85; font-size: 1.02rem; max-width: 560px; margin: 0 auto 30px; position: relative; line-height: 1.7; }
        .lp-cta .lp-btn { background: #F5EFE3; color: var(--fleuve-deep); position: relative; box-shadow: 0 16px 40px -16px rgba(0,0,0,0.5); }
        .lp-cta .lp-btn:hover { transform: translateY(-2px); }
        /* Footer */
        .lp-footer { background: #0E0C08; color: #EDE3CE; padding: 70px 0 34px; margin-top: 0; }
        .lp-footer-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 40px; }
        .lp-footer h5 { font-family: var(--font-mono); font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--or); margin: 0 0 18px; }
        .lp-footer p { opacity: .8; font-size: 14.5px; line-height: 1.7; margin: 14px 0 0; max-width: 300px; }
        .lp-footer ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 11px; }
        .lp-footer ul a { color: #EDE3CE; opacity: .8; text-decoration: none; font-size: 15px; cursor: pointer; transition: opacity .2s; background: none; border: 0; padding: 0; font-family: 'Space Grotesk', sans-serif; }
        .lp-footer ul a:hover { opacity: 1; color: var(--or); }
        .lp-footer-bottom { border-top: 1px solid rgba(245,239,227,0.14); margin-top: 50px; padding-top: 24px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
        .lp-footer-bottom span { font-family: var(--font-mono); font-size: 12px; opacity: .6; }
        .lp-footer-bottom .secure { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 11px; opacity: .85; }
        .lp-footer-bottom .secure svg { color: var(--or); }
        .lp-socials { display: flex; gap: 10px; }
        .lp-socials a { width: 36px; height: 36px; border: 1px solid rgba(245,239,227,0.25); border-radius: 8px; display: grid; place-items: center; color: var(--bg); opacity: .8; transition: all .2s; }
        .lp-socials a:hover { opacity: 1; border-color: var(--or); color: var(--or); transform: translateY(-2px); }
        /* Chat */
        .lp-chat-btn { position: fixed; bottom: 26px; right: 26px; width: 58px; height: 58px; border-radius: 50%; background: var(--fleuve); color: #F5EFE3; border: 0; cursor: pointer; display: grid; place-items: center; box-shadow: 0 16px 40px -12px rgba(31,111,107,0.6); z-index: 80; transition: transform .2s; }
        .lp-chat-btn:hover { transform: scale(1.07); }
        .lp-chat-panel { position: fixed; bottom: 96px; right: 26px; width: 360px; max-width: calc(100vw - 40px); height: 480px; max-height: calc(100vh - 130px); background: var(--surface); border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 30px 80px -20px rgba(0,0,0,0.4); display: flex; flex-direction: column; overflow: hidden; z-index: 81; }
        .lp-chat-head { background: var(--fleuve); color: #F5EFE3; padding: 16px 18px; display: flex; justify-content: space-between; align-items: center; }
        .lp-chat-head b { font-family: var(--font-serif); font-size: 1.05rem; }
        .lp-chat-head span { font-size: 12px; opacity: .85; display: flex; align-items: center; gap: 7px; }
        .lp-chat-head .live { width: 8px; height: 8px; border-radius: 50%; background: #7CE3B0; display: inline-block; }
        .lp-chat-head button { background: none; border: 0; color: #F5EFE3; cursor: pointer; display: grid; place-items: center; }
        .lp-chat-msgs { flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 10px; }
        .lp-msg { max-width: 82%; padding: 12px 15px; border-radius: 12px; font-size: 15.5px; line-height: 1.55; white-space: pre-wrap; }
        .lp-msg.user { align-self: flex-end; background: var(--fleuve); color: #F5EFE3; border-bottom-right-radius: 4px; }
        .lp-msg.assistant { align-self: flex-start; background: var(--bg); border: 1px solid var(--line); color: var(--ink); border-bottom-left-radius: 4px; }
        .lp-chat-input { display: flex; gap: 10px; padding: 14px; border-top: 1px solid var(--line); }
        .lp-chat-input input { flex: 1; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 12px 14px; color: var(--ink); font-size: 13.5px; }
        .lp-chat-input input:focus { outline: none; border-color: var(--fleuve); }
        .lp-chat-input button { background: var(--fleuve); color: #F5EFE3; border: 0; border-radius: 8px; width: 44px; cursor: pointer; display: grid; place-items: center; }
        /* Cookie */
        .lp-cookie { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #0E0C08; color: #EDE3CE; border-radius: 12px; padding: 18px 22px; display: flex; align-items: center; gap: 18px; z-index: 95; max-width: min(640px, calc(100vw - 32px)); box-shadow: 0 24px 60px -20px rgba(0,0,0,0.5); }
        .lp-cookie span { font-size: 15px; line-height: 1.5; opacity: .9; }
        .lp-cookie button { background: var(--or); color: #14100B; border: 0; border-radius: 8px; padding: 12px 24px; font-family: var(--font-mono); font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all .3s cubic-bezier(0.25, 1, 0.5, 1); }
        .lp-cookie button:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -10px rgba(169,116,17,0.8); }
        /* Back to top */
        .lp-top { position: fixed; bottom: 26px; left: 26px; width: 46px; height: 46px; border-radius: 50%; background: var(--surface); border: 1px solid var(--line); color: var(--fleuve); cursor: pointer; display: grid; place-items: center; z-index: 80; box-shadow: var(--shadow); transition: all .25s; }
        .lp-top:hover { background: var(--fleuve); color: #F5EFE3; }
        /* Modal */
        .lp-modal-overlay { position: fixed; inset: 0; background: rgba(21,16,9,0.55); backdrop-filter: blur(6px); z-index: 99; display: grid; place-items: center; padding: 20px; }
        .lp-modal { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 34px; max-width: 520px; width: 100%; position: relative; }
        .lp-modal h3 { font-family: var(--font-serif); font-size: 1.4rem; margin: 0 0 14px; }
        .lp-modal p { color: var(--muted); font-size: 14.5px; line-height: 1.7; }
        .lp-modal .close { position: absolute; top: 16px; right: 16px; background: none; border: 0; color: var(--muted); cursor: pointer; transition: color .2s, transform .2s; }
        .lp-modal .close:hover { color: var(--terre); transform: scale(1.15); }
        /* Newsletter */
        .lp-news { display: flex; gap: 10px; margin-top: 18px; max-width: 420px; }
        .lp-news input { flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(245,239,227,0.2); border-radius: 8px; padding: 14px 16px; color: #EDE3CE; font-size: 15.5px; }
        .lp-news input::placeholder { color: rgba(245,239,227,0.5); }
        .lp-news input:focus { outline: none; border-color: var(--or); }
        .lp-news button { background: var(--or); color: #14100B; border: 0; border-radius: 8px; padding: 13px 22px; font-family: var(--font-mono); font-size: 12px; font-weight: 600; cursor: pointer; }
        .lp-news .news-msg { font-family: var(--font-mono); font-size: 12px; color: var(--or); margin-top: 10px; }
        .lp-mobile-menu { position: fixed; inset: 0; background: var(--bg); z-index: 92; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px; }
        .lp-mobile-menu a { color: var(--ink); text-decoration: none; font-family: var(--font-serif); font-size: 1.7rem; }
        .lp-mobile-menu button { font-family: var(--font-mono); font-size: 13px; }
        @media (max-width: 900px) {
          .lp-hero-grid, .lp-split, .lp-ai, .lp-mobile, .lp-sec-grid, .lp-calc, .lp-contact-grid { grid-template-columns: 1fr; }
          .lp-split.reverse .lp-split-text { order: 0; } .lp-split.reverse .lp-split-visual { order: 0; }
          .lp-feat-grid, .lp-steps, .lp-testi-grid, .lp-team-grid { grid-template-columns: 1fr; }
          .lp-band { padding: 64px 0; }
          .lp-chip-1 { left: 6px; } .lp-chip-2 { right: 6px; }
          .lp-empire { padding: 44px 26px; }
          .lp-cta { padding: 60px 26px; }
          .lp-footer-grid { grid-template-columns: 1fr 1fr; }
          .lp-nav-links { display: none; }
          .lp-nav-inner .lp-link { display: none; }
          .lp-nav-inner .lp-btn-fleuve { padding: 10px 14px !important; font-size: 12px; }
          .lp-nav-inner > div { gap: 8px !important; }
          .lp-mobile-burger { display: grid !important; }
        }
        @media (max-width: 560px) { .lp-footer-grid { grid-template-columns: 1fr; } .lp-calc { padding: 30px 22px; } }
      `}</style>

      {/* Progress bar */}
      <motion.div className="lp-progress" style={{ scaleX: scrollYProgress }} />

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <Logo />
          <div className="lp-nav-links">
            <a href="#features">{L.nav_features}</a>
            <a href="#showcase">{L.nav_demo}</a>
            <a href="#multi-magasins">{L.footer_f2}</a>
            <a href="#analytiques">{L.footer_f3}</a>
            <a href="#securite">{L.footer_f4}</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="lp-icon-btn" onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')} aria-label="Langue">
              {language === 'fr' ? 'EN' : 'FR'}
            </button>
            <button className="lp-icon-btn" onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label="Thème">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="lp-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--muted)', fontFamily: 'Space Grotesk' }}
            >{L.nav_login}</button>
            <button className="lp-btn lp-btn-fleuve" style={{ padding: '11px 18px' }} onClick={() => navigate('/register')}>{L.nav_cta}</button>
            <button className="lp-icon-btn lp-mobile-burger" style={{ display: 'none' }} onClick={() => setMenuOpen(true)} aria-label="Menu">
              <Menu size={18} />
            </button>
          </div>
        </div>
      </nav>
      <AnimatePresence>
        {menuOpen && (
          <motion.div className="lp-mobile-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <a href="#features" onClick={() => setMenuOpen(false)}>{L.nav_features}</a>
            <a href="#showcase" onClick={() => setMenuOpen(false)}>{L.nav_demo}</a>
            <a href="#multi-magasins" onClick={() => setMenuOpen(false)}>{L.footer_f2}</a>
            <a href="#analytiques" onClick={() => setMenuOpen(false)}>{L.footer_f3}</a>
            <a href="#securite" onClick={() => setMenuOpen(false)}>{L.footer_f4}</a>
            <button className="lp-btn lp-btn-fleuve" onClick={() => { setMenuOpen(false); navigate('/register'); }}>{L.nav_cta}</button>
            <button className="lp-btn lp-btn-ghost" onClick={() => { setMenuOpen(false); navigate('/login'); }}>{L.nav_login}</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <header className="lp-hero">
        <div className="lp-container">
          <div className="lp-hero-grid">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'circOut' }}>
              <span className="lp-badge"><Sparkles size={15} /> {L.hero_badge}</span>
              <h1>{L.hero_title_1} <em>{L.hero_title_2}</em></h1>
              <p className="lp-hero-sub">{L.hero_sub}</p>
              <div className="lp-hero-btns">
                <button className="lp-btn lp-btn-fleuve" onClick={() => navigate('/register')}>
                  {L.hero_cta} <ArrowRight size={15} />
                </button>
                <button className="lp-btn lp-btn-ghost" onClick={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}>
                  {L.hero_cta2}
                </button>
              </div>
              <div className="lp-hero-stats">
                <div className="lp-hero-stat"><b><AnimatedCounter value={500} />+</b><span>{L.stats_stores}</span></div>
                <div className="lp-hero-stat"><b><AnimatedCounter value={99.9} decimals={1} />%</b><span>{L.stats_uptime}</span></div>
                <div className="lp-hero-stat"><b><AnimatedCounter value={24} />/7</b><span>{L.stats_support}</span></div>
                <div className="lp-hero-stat"><b><AnimatedCounter value={3} /></b><span>{L.stats_currencies}</span></div>
              </div>
            </motion.div>
            <motion.div className="lp-hero-visual" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15, ease: 'circOut' }}>
              <div className="lp-frame">
                <div className="lp-frame-bar"><i /><i /><i /></div>
                <img src="/screen3.png" alt="Dashboard LUMO" />
              </div>
              <div className="lp-chip lp-chip-1"><TrendingUp size={16} /> <b>+18%</b> CA</div>
              <div className="lp-chip lp-chip-2"><Package size={16} /> <b>Stock</b> critique</div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* ── TRUSTED ── */}
      <div className="lp-trusted">
        <p>{L.trusted_by}</p>
        <div className="lp-marquee">
          {[0, 1].map((k) => (
            <span key={k}>
              {['Matadi', 'Boma', 'Kinshasa', 'Lubumbashi', 'Goma', 'Brazzaville', 'Pointe-Noire', 'Kikwit', 'Mbandaka', 'Bukavu'].map((city) => (
                <span key={city}>{city.toUpperCase()} <i>◆</i></span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── SHOWCASE ── */}
      <section id="showcase" className="lp-band">
        <div className="lp-container">
          <span className="lp-eyebrow">{L.showcase_eyebrow}</span>
          <h2 className="lp-title">{L.showcase_title} <em>{L.showcase_title2}</em></h2>
          <p className="lp-sub">{L.showcase_sub}</p>
          <div style={{ display: 'grid', gap: 110, marginTop: 70 }}>
            {splits.map((s, i) => (
              <motion.div key={i} className={`lp-split ${s.reverse ? 'reverse' : ''}`}
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, ease: 'circOut' }}>
                <div className="lp-split-text">
                  <span className="lp-eyebrow">{s.eyebrow}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  <ul className="lp-check-list">
                    {s.li.map((item, j) => <li key={j}><CheckCircle2 size={20} /> {item}</li>)}
                  </ul>
                </div>
                <div className="lp-split-visual">
                  <span className="lp-corner lp-corner-tl" />
                  <div className="lp-frame">
                    <div className="lp-frame-bar"><i /><i /><i /></div>
                    <img src={s.img} alt={s.alt} loading="lazy" />
                  </div>
                  <span className="lp-corner lp-corner-br" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="lp-band lp-stripes">
        <div className="lp-container">
          <span className="lp-eyebrow">{L.features_eyebrow}</span>
          <h2 className="lp-title">{L.feat_title}</h2>
          <p className="lp-sub">{L.feat_sub}</p>
          <div className="lp-feat-grid">
            {features.map((f, i) => (
              <motion.div key={i} className="lp-card lp-feat"
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.06 }}>
                <div className="lp-feat-icon" style={{ background: `color-mix(in srgb, ${f.color} 12%, transparent)`, color: f.color }}>
                  <f.icon size={24} />
                </div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-band">
        <div className="lp-container">
          <span className="lp-eyebrow">{L.hiw_eyebrow}</span>
          <h2 className="lp-title">{L.hiw_title}</h2>
          <p className="lp-sub">{L.hiw_sub}</p>
          <div className="lp-steps">
            {steps.map((s, i) => (
              <motion.div key={i} className="lp-card lp-step"
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}>
                <b>{s.n}</b>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MULTI-MAGASINS ── */}
      <section id="multi-magasins" className="lp-band">
        <div className="lp-container">
          <motion.div className="lp-empire" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="lp-eyebrow" style={{ position: 'relative' }}>{L.footer_f2}</span>
            <h2>{L.multi_empire_title}</h2>
            <p>{L.multi_empire_sub}</p>
          </motion.div>
        </div>
      </section>

      {/* ── ANALYTIQUES / IA ── */}
      <section id="analytiques" className="lp-band lp-stripes-terre">
        <div className="lp-container">
          <div className="lp-ai">
            <motion.div className="lp-ai-panel lp-card" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <span className="lp-eyebrow"><Cpu size={15} /> {L.ai_badge}</span>
              <p className="lp-ai-quote">{L.ai_quote}</p>
              <div className="lp-ai-chips">
                <span className="lp-ai-chip green"><TrendingUp size={14} /> {L.ai_chip_revenue}</span>
                <span className="lp-ai-chip terre"><Package size={14} /> {L.ai_chip_stock}</span>
                <span className="lp-ai-chip"><Sparkles size={14} /> {L.ai_chip_report}</span>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <span className="lp-eyebrow">{L.eyebrow_analytics}</span>
              <h2 className="lp-title">{L.ai_title}</h2>
              <p className="lp-sub">{L.ai_sub}</p>
              <ul className="lp-ai-list" style={{ marginTop: 28 }}>
                <li><Zap size={18} /><span><b>{L.ai_p1}</b></span></li>
                <li><Activity size={18} /><span><b>{L.ai_p2}</b></span></li>
                <li><BarChart3 size={18} /><span><b>{L.ai_p3}</b></span></li>
                <li><TrendingUp size={18} /><span><b>{L.ai_p4}</b></span></li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MOBILE ── */}
      <section className="lp-band">
        <div className="lp-container">
          <div className="lp-mobile">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <span className="lp-eyebrow">{L.mobile_eyebrow}</span>
              <h2 className="lp-title">{L.mobile_title}</h2>
              <p className="lp-sub">{L.mobile_sub}</p>
              <ul className="lp-mobile-list">
                <li><Smartphone size={18} /> {L.mobile_feat1}</li>
                <li><Bell size={18} /> {L.mobile_feat2}</li>
                <li><Zap size={18} /> {L.mobile_feat3}</li>
              </ul>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}>
              <div className="lp-phone">
                <img src="/dashboard_mobile.png" alt="LUMO mobile" loading="lazy" />
                <div className="lp-phone-notif">
                  <span className="dot"><Bell size={16} /></span>
                  <div><b>{L.mobile_notification_label}</b><span>{L.mobile_notification_text}</span></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECURITE ── */}
      <section id="securite" className="lp-band lp-stripes">
        <div className="lp-container">
          <div className="lp-sec-grid">
            <motion.div className="lp-sec-card lp-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <span className="lp-eyebrow" style={{ position: 'relative' }}><Lock size={13} /> {L.footer_f4}</span>
              <div className="big">99.9%</div>
              <h3>{L.security_title}</h3>
              <p className="lp-sub" style={{ position: 'relative', marginTop: 10 }}>{L.security_desc}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
              <ul className="lp-sec-list">
                <li><ShieldCheck size={18} /><span><b>{L.security_li1}</b></span></li>
                <li><Lock size={18} /><span><b>{L.security_li2}</b></span></li>
                <li><CheckCircle2 size={18} /><span><b>{L.security_li3}</b></span></li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── VS ── */}
      <section className="lp-band">
        <div className="lp-container">
          <span className="lp-eyebrow">{L.vs_eyebrow}</span>
          <h2 className="lp-title">{L.vs_title}</h2>
          <p className="lp-sub">{L.vs_sub}</p>
          <motion.div className="lp-vs" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="lp-vs-row head">
              <div>{L.vs_col_feature}</div>
              <div className="ok">{L.vs_lumo}</div>
              <div>{L.vs_classic}</div>
            </div>
            {vsRows.map((row, i) => (
              <div className="lp-vs-row" key={i}>
                <div className="feat">{row}</div>
                <div className="ok"><Check size={15} /> {L.vs_lumo}</div>
                <div className="no"><X size={15} /> {L.vs_classic}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="lp-band lp-stripes">
        <div className="lp-container">
          <span className="lp-eyebrow">{L.testi_eyebrow}</span>
          <h2 className="lp-title">{L.testi_title}</h2>
          <p className="lp-sub">{L.testi_sub}</p>
          <div className="lp-testi-grid">
            {testimonials.map((t, i) => (
              <motion.div key={i} className="lp-card lp-testi"
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}>
                <div className="stars">{Array.from({ length: 5 }).map((_, s) => <Star key={s} size={14} fill="currentColor" />)}</div>
                <p>« {t.text} »</p>
                <div className="who">{t.role}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CALCULATOR ── */}
      <section id="calculator" className="lp-band">
        <div className="lp-container">
          <span className="lp-eyebrow"><Calculator size={13} /> {L.roi_eyebrow}</span>
          <h2 className="lp-title">{L.roi_title}</h2>
          <p className="lp-sub">{L.roi_sub}</p>
          <div className="lp-calc">
            <div>
              <label>{L.roi_sales_per_day} — <span className="val">{salesPerDay}</span></label>
              <input type="range" min={5} max={100} value={salesPerDay} onChange={(e) => setSalesPerDay(Number(e.target.value))} />
              <label style={{ marginTop: 26 }}>{L.roi_avg_basket} — <span className="val">{avgBasket.toLocaleString('fr-FR')} FC</span></label>
              <input type="range" min={2000} max={100000} step={500} value={avgBasket} onChange={(e) => setAvgBasket(Number(e.target.value))} />
            </div>
            <div className="lp-result">
              <div className="res"><span>{L.roi_time_saved}</span><b>{timeSaved} h/mois</b></div>
              <div className="res"><span>{L.roi_money_saved}</span><b>{moneySaved.toLocaleString('fr-FR')} FC</b></div>
              <button className="lp-btn lp-btn-fleuve" style={{ marginTop: 12, justifyContent: 'center' }} onClick={() => navigate('/register')}>
                {L.roi_cta} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="lp-band">
        <div className="lp-container">
          <span className="lp-eyebrow">{L.faq_eyebrow}</span>
          <h2 className="lp-title" style={{ textAlign: 'center' }}>{L.faq_title}</h2>
          <p className="lp-sub" style={{ margin: '0 auto', textAlign: 'center' }}>{L.faq_sub}</p>
          <div className="lp-faq">
            {faqs.map((f, i) => (
              <div key={i} className={`lp-faq-item ${openFaqIndex === i ? 'open' : ''}`}>
                <button className="lp-faq-q" onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}>
                  {f.q} <ChevronDown size={18} />
                </button>
                {openFaqIndex === i && <div className="lp-faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="lp-band lp-stripes">
        <div className="lp-container">
          <span className="lp-eyebrow">{L.contact_sub}</span>
          <h2 className="lp-title">{L.contact_title}</h2>
          <div className="lp-contact-grid">
            <div className="lp-contact-info">
              <div className="row"><div className="icon-box"><MapPin size={22} /></div> <div><b>Bureaux</b><span>{L.contact_location}</span></div></div>
              <div className="row"><div className="icon-box"><Phone size={22} /></div> <div><b>Téléphone direct</b><span>{L.contact_phone}</span></div></div>
              <div className="row"><div className="icon-box"><Mail size={22} /></div> <div><b>Email de support</b><span>{L.contact_email}</span></div></div>
              <div className="row"><div className="icon-box"><MessageSquare size={22} /></div> <div><b>Support</b><span>{L.contact_sub}</span></div></div>
            </div>
            <motion.form className="lp-form lp-card" onSubmit={handleContactSubmit} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <input placeholder={L.contact_ph_name} value={contactForm.nom} onChange={(e) => setContactForm({ ...contactForm, nom: e.target.value })} />
              <input type="email" placeholder={L.contact_ph_email} value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
              <textarea placeholder={L.contact_ph_message} value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} />
              <button type="submit" className="lp-btn lp-btn-fleuve" style={{ justifyContent: 'center' }} disabled={sendingContact}>
                {sendingContact ? L.contact_sending : L.contact_send} {!sendingContact && <Send size={16} />}
              </button>
            </motion.form>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-band">
        <div className="lp-container">
          <motion.div className="lp-cta" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2>{L.cta_title}</h2>
            <p>{L.cta_sub}</p>
            <button className="lp-btn" onClick={() => navigate('/register')}>{L.cta_btn} <ArrowRight size={15} /></button>
          </motion.div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="lp-band" style={{ paddingTop: 0 }}>
        <div className="lp-container">
          <div style={{ textAlign: 'center' }}>
            <h2 className="lp-title" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}>{L.news_title}</h2>
            <p className="lp-sub" style={{ margin: '0 auto' }}>{L.news_sub}</p>
            <form className="lp-news" style={{ margin: '26px auto 0' }} onSubmit={handleSubscribe}>
              <input type="email" placeholder={L.news_placeholder} value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="submit">{L.news_btn}</button>
            </form>
            {status === 'ok' && <div className="news-msg">{L.news_success}</div>}
            {status === 'error' && <div className="news-msg" style={{ color: 'var(--terre)' }}>{L.news_error}</div>}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div>
              <Logo textColor="#EDE3CE" />
              <p>{L.footer_brand_desc}</p>
            </div>
            <div>
              <h5>{L.footer_product}</h5>
              <ul>
                <li><a onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>{L.footer_f1}</a></li>
                <li><a onClick={() => document.getElementById('multi-magasins')?.scrollIntoView({ behavior: 'smooth' })}>{L.footer_f2}</a></li>
                <li><a onClick={() => document.getElementById('analytiques')?.scrollIntoView({ behavior: 'smooth' })}>{L.footer_f3}</a></li>
                <li><a onClick={() => document.getElementById('securite')?.scrollIntoView({ behavior: 'smooth' })}>{L.footer_f4}</a></li>
              </ul>
            </div>
            <div>
              <h5>{L.footer_company}</h5>
              <ul>
                <li><a onClick={() => handleFooterLink(L.footer_c1, 'LUMO est une plateforme de gestion commerciale pensée pour les entrepreneurs de la RDC et de l\'Afrique centrale.', 'LUMO is a business management platform built for entrepreneurs in the DRC and Central Africa.')}>{L.footer_c1}</a></li>
                <li><a onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>{L.footer_c2}</a></li>
                <li><a onClick={() => handleFooterLink(L.footer_c3, 'Vos données sont chiffrées et ne sont jamais vendues à des tiers. Elles servent uniquement au fonctionnement de votre compte.', 'Your data is encrypted and never sold to third parties. It is only used to operate your account.')}>{L.footer_c3}</a></li>
                <li><a onClick={() => handleFooterLink(L.footer_c4, 'En utilisant LUMO, vous acceptez nos conditions : utilisation responsable, données sécurisées, support réactif.', 'By using LUMO you agree to our terms: responsible use, secured data, responsive support.')}>{L.footer_c4}</a></li>
              </ul>
            </div>
            <div>
              <h5>Réseaux</h5>
              <div className="lp-socials">
                <a href="https://www.linkedin.com/in/ren%C3%A9-nzaku-1b7413408/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={16} /></a>
                <a href="https://x.com/rendevui" target="_blank" rel="noreferrer" aria-label="X"><Twitter size={16} /></a>
                <a href="https://web.facebook.com/rcdevui" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={16} /></a>
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© 2026 LUMO — {L.footer_copy}</span>
            <span className="secure"><Lock size={13} /> {L.footer_secure_data}</span>
          </div>
        </div>
      </footer>

      {/* ── CHAT ── */}
      <button className="lp-chat-btn" onClick={() => setChatOpen(!chatOpen)} aria-label="Chat">
        {chatOpen ? <X size={22} /> : <MessageSquare size={22} />}
      </button>
      <AnimatePresence>
        {chatOpen && (
          <motion.div className="lp-chat-panel" initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }} transition={{ duration: 0.25 }}>
            <div className="lp-chat-head">
              <b>LUMO Assistant</b>
              <span><i className="live" /> {L.chat_online}</span>
              <button onClick={() => setChatOpen(false)} aria-label="Fermer"><X size={17} /></button>
            </div>
            <div className="lp-chat-msgs">
              {chatMessages.map((m, i) => (
                <div key={i} className={`lp-msg ${m.role}`}>{m.content}</div>
              ))}
              {isTyping && <div className="lp-msg assistant">…</div>}
              <div ref={chatEndRef} />
            </div>
            <div className="lp-chat-input">
              <input
                placeholder={L.chat_placeholder}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
              />
              <button onClick={handleSendChat} aria-label="Envoyer"><Send size={16} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COOKIE ── */}
      <AnimatePresence>
        {showCookie && (
          <motion.div className="lp-cookie" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}>
            <span>{L.cookie_banner_text}</span>
            <button onClick={acceptCookies}>{L.cookie_accept_btn}</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BACK TO TOP ── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button className="lp-top" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Haut de page">
            <ChevronUp size={19} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── FOOTER MODAL ── */}
      <AnimatePresence>
        {footerModal.open && (
          <motion.div className="lp-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFooterModal({ ...footerModal, open: false })}>
            <motion.div className="lp-modal" initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }} onClick={(e) => e.stopPropagation()}>
              <button className="close" onClick={() => setFooterModal({ ...footerModal, open: false })} aria-label="Fermer"><X size={18} /></button>
              <h3>{footerModal.title}</h3>
              <p>{footerModal.content}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
