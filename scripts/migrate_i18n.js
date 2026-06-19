const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'client/src/pages/Dashboard.tsx',
  'client/src/pages/Sales.tsx',
  'client/src/pages/Products.tsx',
  'client/src/pages/POS.tsx',
  'client/src/pages/Settings.tsx',
  'client/src/pages/Stats.tsx',
  'client/src/components/common/ConfirmModal.tsx',
  'client/src/components/common/Modal.tsx',
  'client/src/utils/exportUtils.ts',
  'client/src/utils/printHelpers.ts',
  'client/src/pages/SuperAdminDashboard.tsx',
  'client/src/pages/Landing.tsx'
];

const dict = {
  // Sales.tsx
  "Flux des Ventes": "salesFlow",
  "Suivi analytique de toutes vos transactions commerciales": "salesTrackingDesc",
  "Nouvelle Vente": "newSale",
  "CHIFFRE D'AFFAIRES": "revenueCaps",
  "PANIER MOYEN": "averageCartCaps",
  "TRANSACTIONS": "transactionsCaps",
  "Référence / Client": "refClient",
  "Date & Méthode": "dateMethod",
  "Montant Total": "totalAmount",
  "Rechercher par référence ou client...": "searchRefClient",
  "Masquer Filtres": "hideFilters",
  "Filtres": "filters",
  "DATE": "dateCaps",
  "MÉTHODE": "methodCaps",
  "RAZ": "resetFilters",
  
  // Products.tsx
  "Produits & Stock": "productsStock",
  "Inventaire Global": "globalInventory",
  "Valeur Stock (Vente)": "stockValueSale",
  "Coût Total (Achat)": "totalCostPurchase",
  "Rechercher une référence ou une catégorie...": "searchRefCategory",
  "Modèle": "templateBtn",
  "Texte": "textBtn",
  "Nouveau Produit": "newProduct",
  "Mise à jour Article": "updateArticle",
  "Importation Rapide": "quickImport",
  
  // POS.tsx
  "Rechercher un produit...": "searchProductPlaceholder",
  "Scanner un code-barres": "scanBarcode",
  "Ouvrir Caisse": "openRegisterBtn",
  "Fermer Caisse": "closeRegisterBtn",
  "Vérification...": "verifying",
  "Montant reçu": "amountReceived",
  "Client de passage": "walkInClient",
  "Caisse ouverte !": "registerOpenedSuccess",
  "Vente terminée avec succès !": "saleCompletedSuccess",
  "Encaisser": "cashIn",
  "Vider": "clearCart",
  
  // Settings.tsx
  "Gestion de l'équipe": "teamManagement",
  "Créez et gérez les accès pour vos vendeurs et gestionnaires": "teamManagementDesc",
  "Ajouter un membre": "addMember",
  "Double Authentification (2FA)": "twoFactorAuth",
  "Configurer la 2FA": "setup2FA",
  "Scannez le QR Code avec Google Authenticator ou Authy": "scanQRCodeDesc",
  "Clé secrète manuelle": "manualSecretKey",
  "Code de vérification (6 chiffres)": "verificationCode6",
  "Activer la 2FA": "activate2FA",
  
  // Stats.tsx
  "Analytiques Avancées": "advancedAnalytics",
  "Rapports détaillés depuis vos vraies données": "detailedReportsDesc",
  "Aujourd'hui": "today",
  "7 derniers jours": "last7days",
  "30 derniers jours": "last30days",
  "12 derniers mois": "last12months",
  "Performance d'aujourd'hui": "performanceToday",
  "Performance des 30 derniers jours": "performance30Days",
  "Performance de l'année": "performanceYear",
  "Stock par catégorie": "stockByCategory",
  "Top Produits": "topProductsTitle",
  "Revenu des 6 derniers mois": "revenue6Months",
  
  // Dashboard.tsx
  "Raccourcis Stratégiques": "strategicShortcuts",
  
  // Modals & Commons
  "Confirmer": "confirmBtn",
  "Annuler": "cancelBtn",
  "Oui, se déconnecter": "yesLogout",
  "Rester": "stayBtn"
};

// Generates English translations automatically (simple replacements for now, user can tune later)
const enDict = {
  "salesFlow": "Sales Flow",
  "salesTrackingDesc": "Analytical tracking of all your commercial transactions",
  "newSale": "New Sale",
  "revenueCaps": "REVENUE",
  "averageCartCaps": "AVERAGE CART",
  "transactionsCaps": "TRANSACTIONS",
  "refClient": "Reference / Client",
  "dateMethod": "Date & Method",
  "totalAmount": "Total Amount",
  "searchRefClient": "Search by reference or client...",
  "hideFilters": "Hide Filters",
  "filters": "Filters",
  "dateCaps": "DATE",
  "methodCaps": "METHOD",
  "resetFilters": "RESET",
  "productsStock": "Products & Stock",
  "globalInventory": "Global Inventory",
  "stockValueSale": "Stock Value (Sale)",
  "totalCostPurchase": "Total Cost (Purchase)",
  "searchRefCategory": "Search reference or category...",
  "templateBtn": "Template",
  "textBtn": "Text",
  "newProduct": "New Product",
  "updateArticle": "Update Article",
  "quickImport": "Quick Import",
  "searchProductPlaceholder": "Search a product...",
  "scanBarcode": "Scan a barcode",
  "openRegisterBtn": "Open Register",
  "closeRegisterBtn": "Close Register",
  "verifying": "Verifying...",
  "amountReceived": "Amount received",
  "walkInClient": "Walk-in client",
  "registerOpenedSuccess": "Register opened successfully!",
  "saleCompletedSuccess": "Sale completed successfully!",
  "cashIn": "Cash In",
  "clearCart": "Clear",
  "teamManagement": "Team Management",
  "teamManagementDesc": "Create and manage access for your sellers and managers",
  "addMember": "Add a member",
  "twoFactorAuth": "Two-Factor Authentication (2FA)",
  "setup2FA": "Setup 2FA",
  "scanQRCodeDesc": "Scan the QR Code with Google Authenticator or Authy",
  "manualSecretKey": "Manual secret key",
  "verificationCode6": "Verification code (6 digits)",
  "activate2FA": "Activate 2FA",
  "advancedAnalytics": "Advanced Analytics",
  "detailedReportsDesc": "Detailed reports from your real data",
  "today": "Today",
  "last7days": "Last 7 days",
  "last30days": "Last 30 days",
  "last12months": "Last 12 months",
  "performanceToday": "Today's Performance",
  "performance30Days": "Last 30 Days Performance",
  "performanceYear": "Year's Performance",
  "stockByCategory": "Stock by category",
  "topProductsTitle": "Top Products",
  "revenue6Months": "Last 6 Months Revenue",
  "strategicShortcuts": "Strategic Shortcuts",
  "confirmBtn": "Confirm",
  "cancelBtn": "Cancel",
  "yesLogout": "Yes, logout",
  "stayBtn": "Stay"
};

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('Skipping ' + filePath + ' (not found)');
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Add useTranslation import if missing
  if (content.includes('t(') || Object.keys(dict).some(k => content.includes(k))) {
    if (!content.includes('useTranslation') && filePath.endsWith('.tsx')) {
      content = "import { useTranslation } from '../hooks/useTranslation';\n" + content;
      // Inject const { t } = useTranslation(); into main component (very naive, usually works for default exports)
      content = content.replace(/(const [A-Z][a-zA-Z0-9_]* = \([^)]*\) => {)/, "$1\n  const { t } = useTranslation();");
    }
  }

  // 1. Replace JSX Text (e.g. >Texte<)
  Object.keys(dict).forEach(frText => {
    const key = dict[frText];
    // >Texte< -> >{t('key')}<
    const regexJsx = new RegExp('>' + frText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '<', 'g');
    content = content.replace(regexJsx, '>{t(\'' + key + '\')}<');
    
    // "Texte" -> t('key') (in props or code)
    const regexQuote1 = new RegExp('"' + frText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"', 'g');
    content = content.replace(regexQuote1, 't(\'' + key + '\')');

    const regexQuote2 = new RegExp("'" + frText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "'", 'g');
    content = content.replace(regexQuote2, 't(\'' + key + '\')');
  });

  // 2. Replace toast.error("...") -> toast.error(t("..."))
  // We'll just extract them and add them to translations dynamically!
  const toastRegex = /toast\.(success|error|info)\((['"`])([^'"`]+)\2\)/g;
  let match;
  while ((match = toastRegex.exec(originalContent)) !== null) {
    const type = match[1];
    const frText = match[3];
    if (frText.includes('t(') || frText.includes('$')) continue; // skip already translated or templates
    
    // Create a key
    const safeKey = frText.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15) + 'Msg';
    dict[frText] = safeKey;
    enDict[safeKey] = "[EN] " + frText;
    
    // Replace in content
    const exactCall = match[0];
    const newCall = `toast.${type}(t('${safeKey}'))`;
    content = content.replace(exactCall, newCall);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Patched ' + filePath);
  }
}

// Run patcher
filesToProcess.forEach(patchFile);

// Update translations.ts
const transPath = 'client/src/translations.ts';
let transContent = fs.readFileSync(transPath, 'utf8');

// Inject keys into fr and en objects
const frObjMatch = transContent.match(/const fr = {([\s\S]*?)};/);
const enObjMatch = transContent.match(/const en = {([\s\S]*?)};/);

if (frObjMatch && enObjMatch) {
  let frBlock = frObjMatch[1];
  let enBlock = enObjMatch[1];

  Object.keys(dict).forEach(frText => {
    const key = dict[frText];
    if (!frBlock.includes(`'${key}':`)) {
      frBlock += `\n  '${key}': '${frText.replace(/'/g, "\\'")}',`;
    }
    if (!enBlock.includes(`'${key}':`)) {
      enBlock += `\n  '${key}': '${(enDict[key] || frText).replace(/'/g, "\\'")}',`;
    }
  });

  transContent = transContent.replace(/const fr = {[\s\S]*?};/, `const fr = {${frBlock}};`);
  transContent = transContent.replace(/const en = {[\s\S]*?};/, `const en = {${enBlock}};`);

  fs.writeFileSync(transPath, transContent, 'utf8');
  console.log('Updated translations.ts');
}

console.log('Migration script finished.');
