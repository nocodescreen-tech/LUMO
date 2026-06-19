import { useEffect } from 'react';
import { translations } from '../translations';
import { useAuthStore } from '../store/useAuthStore';

type Lang = 'fr' | 'en';

const uiPhrases: Record<string, string> = {
  // Navigation and layout
  'Tableau de Bord': 'Dashboard',
  'Tableau de bord': 'Dashboard',
  'Caisse (POS)': 'Point of Sale (POS)',
  'Produits & Stocks': 'Products & Stock',
  'Ventes': 'Sales',
  'Achats': 'Purchases',
  'Clients': 'Clients',
  'Fournisseurs': 'Suppliers',
  'Dettes': 'Debts',
  'Activites': 'Activities',
  'Activités': 'Activities',
  'Statistiques': 'Statistics',
  'Parametres': 'Settings',
  'Paramètres': 'Settings',
  'Tresorerie': 'Cash',
  'Trésorerie': 'Cash',
  'Historique Stock': 'Stock History',
  'Historique des Stocks': 'Stock History',
  'Historique complet': 'Full history',
  'Admin Platform': 'Admin Platform',
  'Parametres Globaux': 'Global Settings',
  'Paramètres Globaux': 'Global Settings',
  'Audit Logs': 'Audit Logs',
  'STORE': 'STORE',
  'PLATFORM': 'PLATFORM',
  'Naviguer vers...': 'Navigate to...',
  'Aucun resultat': 'No result',
  'Aucun résultat': 'No result',
  'HORS-LIGNE': 'OFFLINE',
  'Nouvelle notification': 'New notification',
  'Voir': 'View',
  'Deconnexion': 'Logout',
  'Déconnexion': 'Logout',
  'Oui, se deconnecter': 'Yes, log out',
  'Oui, se déconnecter': 'Yes, log out',
  'Quitter le support': 'Exit support',
  'Tout marquer lu': 'Mark all as read',
  'Aucune notification': 'No notifications',
  'Actualiser': 'Refresh',
  'Tout supprimer': 'Delete all',
  'Vider les notifications': 'Clear notifications',
  'Toutes les notifications marquees comme lues': 'All notifications marked as read',
  'Toutes les notifications marquées comme lues': 'All notifications marked as read',
  'Historique des notifications vide': 'Notification history cleared',
  'Historique des notifications vidé': 'Notification history cleared',

  // Common actions
  'Rechercher...': 'Search...',
  'Rechercher': 'Search',
  'Enregistrer': 'Save',
  'Enregistrer les modifications': 'Save changes',
  'Sauvegarder': 'Save',
  'Modifier': 'Edit',
  'Supprimer': 'Delete',
  'Annuler': 'Cancel',
  'Fermer': 'Close',
  'Retour': 'Back',
  'Suivant': 'Next',
  'Continuer': 'Continue',
  'Confirmer': 'Confirm',
  'Valider': 'Validate',
  'Créer': 'Create',
  'Ajouter': 'Add',
  'Importer': 'Import',
  'Exporter': 'Export',
  'Télécharger': 'Download',
  'Telecharger': 'Download',
  'Imprimer': 'Print',
  'Rapport': 'Report',
  'Action rapide': 'Quick action',
  'Module': 'Module',
  'Chargement...': 'Loading...',
  'En cours...': 'In progress...',
  'Succès': 'Success',
  'Erreur': 'Error',
  'Echec': 'Failure',
  'Échec': 'Failure',
  'Nom': 'Name',
  'Email': 'Email',
  'Téléphone': 'Phone',
  'Telephone': 'Phone',
  'Adresse': 'Address',
  'Ville': 'City',
  'Pays': 'Country',
  'Devise': 'Currency',
  'Statut': 'Status',
  'Date': 'Date',
  'Total': 'Total',
  'Montant': 'Amount',
  'Categorie': 'Category',
  'Catégorie': 'Category',
  'Description': 'Description',

  // Auth
  'Connectez-vous a votre business': 'Sign in to your business',
  'Connectez-vous à votre business': 'Sign in to your business',
  'Mot de passe': 'Password',
  'Mot de Passe': 'Password',
  'Oublie ?': 'Forgot?',
  'Oublié ?': 'Forgot?',
  'Acceder au commerce': 'Access my store',
  'Accéder au commerce': 'Access my store',
  'Connexion en cours...': 'Signing in...',
  'Besoin d\'un acces ?': 'Need access?',
  'Besoin d\'un accès ?': 'Need access?',
  'Commencer maintenant': 'Get started now',
  'Verification en deux etapes': 'Two-step verification',
  'Vérification en deux étapes': 'Two-step verification',
  'Code envoye sur votre email': 'Code sent to your email',
  'Code envoyé sur votre email': 'Code sent to your email',
  'Valide 10 minutes': 'Valid for 10 minutes',
  'Code a 6 chiffres': '6-digit code',
  'Code à 6 chiffres': '6-digit code',
  'Confirmer l\'acces': 'Confirm access',
  'Confirmer l\'accès': 'Confirm access',
  'Propulsez votre Commerce': 'Power up your Business',
  'Quel est votre domaine ?': 'What is your business type?',
  'Identite du Proprietaire': 'Owner Identity',
  'Identité du Propriétaire': 'Owner Identity',
  'Details du Commerce': 'Business Details',
  'Détails du Commerce': 'Business Details',
  'Finaliser mon Compte': 'Create my Account',
  'Creation en cours...': 'Creating account...',
  'Création en cours...': 'Creating account...',
  'Deja partenaire Lumo ?': 'Already a Lumo partner?',
  'Déjà partenaire Lumo ?': 'Already a Lumo partner?',
  'Se connecter ici': 'Sign in here',
  'Nom Complet': 'Full Name',
  'Email Professionnel': 'Professional Email',
  'Nom de l\'Enseigne': 'Business Name',
  'Taux USD -> CDF': 'USD -> CDF Rate',
  'Recuperation de compte': 'Account Recovery',
  'Récupération de compte': 'Account Recovery',
  'Envoyer le code': 'Send code',
  'Envoi en cours...': 'Sending...',
  'Retour a la connexion': 'Back to login',
  'Retour à la connexion': 'Back to login',
  'Verification': 'Verification',
  'Vérification': 'Verification',
  'Verification en cours...': 'Verifying...',
  'Vérification en cours...': 'Verifying...',
  'Renvoyer un nouveau code': 'Resend a new code',

  // Dashboard and analytics
  'Bienvenue': 'Welcome',
  'Pret pour la croissance aujourd\'hui ?': 'Ready for growth today?',
  'Prêt pour la croissance aujourd\'hui ?': 'Ready for growth today?',
  'Ventes Totales': 'Total Sales',
  'Clients Actifs': 'Active Clients',
  'Stock Faible': 'Low Stock',
  'Activites Recentes': 'Recent Activities',
  'Activités Récentes': 'Recent Activities',
  'Tableau de Bord Haute Performance': 'High Performance Dashboard',
  'Propulse par': 'Powered by',
  'Propulsé par': 'Powered by',
  'Systeme Actif': 'System Active',
  'Système Actif': 'System Active',
  'Actualise a': 'Updated at',
  'Actualisé à': 'Updated at',
  'CA de la Periode': 'Period Revenue',
  'CA de la Période': 'Period Revenue',
  'Marge Nette': 'Net Margin',
  'Fidelite Clients': 'Client Loyalty',
  'Fidélité Clients': 'Client Loyalty',
  'Niveau de Stock': 'Stock Level',
  'Trajectoire Financiere': 'Financial Trajectory',
  'Trajectoire Financière': 'Financial Trajectory',
  'Temps Reel': 'Real Time',
  'Temps Réel': 'Real Time',
  'Raccourcis Strategiques': 'Strategic Shortcuts',
  'Raccourcis Stratégiques': 'Strategic Shortcuts',
  'Vente Rapide': 'Quick Sale',
  'Terminal de vente': 'Sales terminal',
  'Gestion du stock': 'Inventory management',
  'Gestion fournisseurs': 'Supplier management',
  'Suivi des paiements': 'Payment tracking',
  'Flux d\'Activite': 'Activity Flow',
  'Flux d\'Activité': 'Activity Flow',
  'Aucune vente detectee pour le moment.': 'No sales detected yet.',
  'Aucune vente détectée pour le moment.': 'No sales detected yet.',
  'Synchronisation de Lumo': 'Lumo Syncing',
  'Preparation de votre console de controle...': 'Preparing your control console...',
  'Préparation de votre console de contrôle...': 'Preparing your control console...',
  'Aujourd\'hui': 'Today',
  '7 derniers jours': 'Last 7 days',
  '30 derniers jours': 'Last 30 days',
  'Nouvelle Vente': 'New Sale',

  // Products
  'Nouveau Produit': 'New Product',
  'Mise a jour Article': 'Update Item',
  'Mise à jour Article': 'Update Item',
  'Importation Rapide': 'Quick Import',
  'Collez votre liste d\'articles (un article par ligne)': 'Paste your item list (one item per line)',
  'Enregistrez une nouvelle reference dans votre catalogue Lumos.': 'Register a new item in your Lumo catalog.',
  'Enregistrez une nouvelle référence dans votre catalogue Lumos.': 'Register a new item in your Lumo catalog.',
  'Ajustez les details de votre reference produit.': 'Adjust this product reference details.',
  'Ajustez les détails de votre référence produit.': 'Adjust this product reference details.',
  'Historique des Mouvements': 'Movement History',
  'Rechercher une reference ou une categorie...': 'Search a reference or category...',
  'Rechercher une référence ou une catégorie...': 'Search a reference or category...',
  'Telecharger le modele Excel pour l\'importation': 'Download the Excel import template',
  'Télécharger le modèle Excel pour l\'importation': 'Download the Excel import template',
  'Importer un fichier Excel': 'Import an Excel file',
  'Historique du stock': 'Stock history',
  'Scannez ou saisissez le code...': 'Scan or enter the code...',
  'Electronique': 'Electronics',
  'Électronique': 'Electronics',
  'Couleur': 'Color',
  'Rouge': 'Red',
  'Taille': 'Size',
  'Produit supprime.': 'Product deleted.',
  'Produit supprimé.': 'Product deleted.',
  'Catalogue entierement vide.': 'Catalog fully cleared.',
  'Catalogue entièrement vidé.': 'Catalog fully cleared.',

  // POS and cash
  'Rechercher un produit...': 'Search a product...',
  'Scanner un code-barres': 'Scan a barcode',
  'Montant recu': 'Amount received',
  'Montant reçu': 'Amount received',
  'Tapez le nom ou \'Client de passage\'...': 'Type the name or \'Walk-in customer\'...',
  'Client de passage': 'Walk-in customer',
  'Caisse ouverte !': 'Cash register opened!',
  'Caisse fermee avec succes !': 'Cash register closed successfully!',
  'Caisse fermée avec succès !': 'Cash register closed successfully!',
  'Vente terminee avec succes !': 'Sale completed successfully!',
  'Vente terminée avec succès !': 'Sale completed successfully!',
  'Vente enregistree localement (Hors-ligne)': 'Sale saved locally (Offline)',
  'Vente enregistrée localement (Hors-ligne)': 'Sale saved locally (Offline)',
  'Toutes les ventes hors-ligne ont ete synchronisees !': 'All offline sales have been synchronized!',
  'Toutes les ventes hors-ligne ont été synchronisées !': 'All offline sales have been synchronized!',
  'En attente du scan...': 'Waiting for scan...',
  'Entrez le code manuellement...': 'Enter the code manually...',

  // Customers, suppliers and debts
  'Rechercher un client, telephone...': 'Search a client, phone...',
  'Rechercher un client, téléphone...': 'Search a client, phone...',
  'Rechercher un fournisseur...': 'Search a supplier...',
  'Credit Client': 'Client Credit',
  'Crédit Client': 'Client Credit',
  'Credits clients, remboursements et echeances en temps reel.': 'Customer credit, repayments and due dates in real time.',
  'Crédits clients, remboursements et échéances en temps réel.': 'Customer credit, repayments and due dates in real time.',
  'Debiteurs Urgents': 'Urgent Debtors',
  'Débiteurs Urgents': 'Urgent Debtors',
  'Creances Normales': 'Normal Receivables',
  'Créances Normales': 'Normal Receivables',
  'Tous': 'All',
  'Tous les clients': 'All clients',
  'Normal': 'Normal',
  'Urgent': 'Urgent',
  'Regles': 'Settled',
  'Réglés': 'Settled',
  'Aucune dette en cours': 'No current debt',
  'Envoyer un rappel': 'Send a reminder',
  'Modifier le client': 'Edit client',
  'Supprimer client': 'Delete client',
  'Client :': 'Client:',
  'Solde restant :': 'Remaining balance:',
  'Tout': 'All',
  'Fournisseur ajoute avec succes': 'Supplier added successfully',
  'Fournisseur ajouté avec succès': 'Supplier added successfully',
  'Fournisseur mis a jour avec succes': 'Supplier updated successfully',
  'Fournisseur mis à jour avec succès': 'Supplier updated successfully',
  'Fournisseur supprime': 'Supplier deleted',
  'Fournisseur supprimé': 'Supplier deleted',
  'Impossible de charger les fournisseurs': 'Unable to load suppliers',
  'Impossible de charger les dettes': 'Unable to load debts',
  'Montant invalide': 'Invalid amount',
  'Erreur lors du reglement': 'Error while settling',
  'Erreur lors du règlement': 'Error while settling',
  'Rappel envoye': 'Reminder sent',
  'Rappel envoyé': 'Reminder sent',
  'Impossible d\'envoyer le rappel': 'Unable to send the reminder',

  // Team/users/settings
  'Equipe': 'Team',
  'Équipe': 'Team',
  'Mon Profil': 'My Profile',
  'Profil & Entreprise': 'Profile & Business',
  'Equipe & Utilisateurs': 'Team & Users',
  'Équipe & Utilisateurs': 'Team & Users',
  'Securite & Mot de passe': 'Security & Password',
  'Sécurité & Mot de passe': 'Security & Password',
  'Theme & Apparence': 'Theme & Appearance',
  'Thème & Apparence': 'Theme & Appearance',
  'Devise & Taux de change': 'Currency & Exchange Rate',
  'Modules & Integrations': 'Modules & Integrations',
  'Modules & Intégrations': 'Modules & Integrations',
  'Sauvegarde des donnees': 'Data Backup',
  'Sauvegarde des données': 'Data Backup',
  'Permissions & Roles': 'Permissions & Roles',
  'Permissions & Rôles': 'Permissions & Roles',
  'Reinitialisation / Danger Zone': 'Reset / Danger Zone',
  'Réinitialisation / Danger Zone': 'Reset / Danger Zone',
  'Ajouter un Collaborateur': 'Add Team Member',
  'Modifier Collaborateur': 'Edit Team Member',
  'Definissez le role et les permissions precises.': 'Define the role and precise permissions.',
  'Définissez le rôle et les permissions précises.': 'Define the role and precise permissions.',
  'Rechercher par nom ou email...': 'Search by name or email...',
  'Membre mis a jour !': 'Member updated!',
  'Membre mis à jour !': 'Member updated!',
  'Membre retire.': 'Member removed.',
  'Membre retiré.': 'Member removed.',
  'Compte reactive !': 'Account reactivated!',
  'Compte réactivé !': 'Account reactivated!',
  'Compte suspendu !': 'Account suspended!',
  'Echec du chargement': 'Loading failed',
  'Échec du chargement': 'Loading failed',
};

const clean = (value: string) => value.replace(/\s+/g, ' ').trim();

const translationsFromKeys = Object.entries(translations.fr).reduce<Record<string, string>>((acc, [key, fr]) => {
  const en = translations.en[key];
  if (typeof fr === 'string' && typeof en === 'string') acc[clean(fr)] = en;
  return acc;
}, {});

const frToEn = { ...translationsFromKeys, ...uiPhrases };
const enToFr = Object.entries(frToEn).reduce<Record<string, string>>((acc, [fr, en]) => {
  acc[clean(en)] = fr;
  return acc;
}, {});

const attrNames = ['placeholder', 'title', 'aria-label', 'alt'];
const skipTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA']);

const translateString = (value: string, language: Lang) => {
  const normalized = clean(value);
  if (!normalized) return value;

  const dictionary = language === 'en' ? frToEn : enToFr;
  const translated = dictionary[normalized];
  if (!translated || translated === normalized) return value;

  const leading = value.match(/^\s*/)?.[0] || '';
  const trailing = value.match(/\s*$/)?.[0] || '';
  return `${leading}${translated}${trailing}`;
};

const translateNode = (node: Node, language: Lang) => {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = node.parentElement;
    if (!parent || skipTags.has(parent.tagName) || parent.closest('[data-no-runtime-translate="true"]')) return;
    const next = translateString(node.nodeValue || '', language);
    if (next !== node.nodeValue) node.nodeValue = next;
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const element = node as HTMLElement;
  if (skipTags.has(element.tagName) || element.closest('[data-no-runtime-translate="true"]')) return;

  attrNames.forEach((attr) => {
    const current = element.getAttribute(attr);
    if (!current) return;
    const next = translateString(current, language);
    if (next !== current) element.setAttribute(attr, next);
  });

  Array.from(element.childNodes).forEach((child) => translateNode(child, language));
};

export const useRuntimeTranslator = () => {
  const language = useAuthStore((state) => state.language);

  useEffect(() => {
    // Only translate when language is English (FR→EN).
    // When language is French, the UI is already in French and the enToFr
    // dictionary can incorrectly translate English-looking French words
    // (e.g. "Stock" → "Mouvements de" via the stockHistoryTitle key collision).
    if (language !== 'en') return;

    const apply = () => translateNode(document.body, language);
    apply();

    const observer = new MutationObserver((mutations) => {
      observer.disconnect();
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData') {
          translateNode(mutation.target, language);
          return;
        }
        mutation.addedNodes.forEach((node) => translateNode(node, language));
        if (mutation.type === 'attributes') translateNode(mutation.target, language);
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: attrNames,
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: attrNames,
    });

    return () => observer.disconnect();
  }, [language]);
};

