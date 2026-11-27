import './inventory-commercial.css';
import { PageSkeleton } from '../design-system/PageSkeleton';
import { LoadFailure } from '../design-system/LoadFailure';
import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  AlertTriangle,
  AlertCircle,
  Edit,
  Trash2,
  X,
  PackageCheck,
  Package,
  Tag,
  Activity,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronRight,
  Boxes,
  Loader2,
  Calendar,
  FileText,
  Zap
} from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import { saveBlob } from '../utils/exportUtils';
import { exportToPDF } from '../utils/reportPDF';
import * as XLSX from 'xlsx';
import { BUSINESS_TYPES } from '../constants/businessTypes';
import { useTranslation } from '../hooks/useTranslation';
import { normalizeAmount, getEffectiveRate } from '../utils/currencyHelpers';

const normalizeActivityType = (type: string | undefined | null) => {
  if (!type) return 'commerce-general';
  if (type in BUSINESS_TYPES) return type;
  const lower = type.toLowerCase();
  if (lower.includes('pharma')) return 'pharmacie';
  if (lower.includes('quinc')) return 'quincaillerie';
  if (lower.includes('mode')) return 'boutique-mode';
  return 'commerce-general';
};

const Products = () => {
  const { t, language } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [view,setView]=useState<'table'|'grid'>('table'),[stockFilter,setStockFilter]=useState('ALL'),[categoryFilter,setCategoryFilter]=useState(''),[sort,setSort]=useState('name');

  const user = useAuthStore(state => state.user);
  const currency = useAuthStore(state => state.currency) || 'CDF';
  const exchangeRate = getEffectiveRate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Helper: checks if current user has a specific permission (module or action level)
  const canDo = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'superadmin') return true;
    return (user.permissions || []).includes(permission);
  };

  // Conversion utility: convert a price from one currency to another
  const convertPrice = (price: number, fromDevise: string, toDevise: string): number => {
    if (fromDevise === toDevise) return price;
    return normalizeAmount(price, fromDevise, toDevise, exchangeRate);
  };

  const normalizeCurrency = (val: string): string => {
    const c = val?.toUpperCase().trim();
    return (c === 'FC' || c === 'CDF') ? 'CDF' : 'USD';
  };

  const [conversionBanner, setConversionBanner] = React.useState<string | null>(null);
  const isPharmacy = normalizeActivityType(user?.typeActivite) === 'pharmacie';

  const getFieldLabel = (field: any) => language === 'en' ? (field.labelEn || field.label) : field.label;
  const getFieldPlaceholder = (field: any) => language === 'en' ? (field.placeholderEn || field.placeholder) : field.placeholder;
  const getFieldOptionLabel = (field: any, option: string, index: number) => (
    language === 'en' ? (field.optionsEn?.[index] || option) : option
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [productHistory, setProductHistory] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyItemsPerPage] = useState(5);
  const [showTextImportModal, setShowTextImportModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const [actionMenuId, setActionMenuId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const importInputRef = React.useRef<HTMLInputElement>(null);

  const handleExportExcel = () => {
    const activityType = normalizeActivityType(user?.typeActivite);
    const businessFields = BUSINESS_TYPES[activityType]?.fields || [];

    const dataToExport = products.map((p: any) => {
      const baseRow: Record<string, any> = {
        Reference: p.id,
        Nom: p.nom,
        Categorie: p.categorie,
        Stock: p.stock,
        PrixVente: p.prix,
        PrixAchat: p.prixAchat,
        Devise: p.devise || currency,
        DatePeremption: p.datePeremption ? new Date(p.datePeremption).toLocaleDateString() : ''
      };

      businessFields.forEach((field) => {
        const val = p?.metadata?.[field.name];
        baseRow[getFieldLabel(field)] = typeof val === 'boolean'
          ? (val ? (language === 'en' ? 'Yes' : 'Oui') : (language === 'en' ? 'No' : 'Non'))
          : (val ?? '');
      });

      return baseRow;
    });
    exportToPDF(dataToExport, language === 'en' ? 'Products Report' : 'Rapport des Produits', user);
  };

  const handleDownloadTemplate = () => {
    const activityType = normalizeActivityType(user?.typeActivite);
    const businessFields = BUSINESS_TYPES[activityType]?.fields || [];

    const isEn = language === 'en';
    const L = (fr: string, en: string) => (isEn ? en : fr);

    // ── Colonnes standard du produit ──
    const standardCols = [
      { key: 'Nom', example: L('Exemple Produit (Obligatoire)', 'Example Product (Required)'), note: L('Obligatoire', 'Required') },
      { key: 'Categorie', example: L('Électronique (Optionnel)', 'Electronics (Optional)'), note: L('Optionnel', 'Optional') },
      { key: 'PrixVente', example: 1500, note: L('Nombre (obligatoire)', 'Number (required)') },
      { key: 'PrixAchat', example: 1000, note: L('Nombre', 'Number') },
      { key: 'Stock', example: 50, note: L('Nombre entier', 'Whole number') },
      { key: 'Devise', example: 'USD', note: L('USD ou CDF (FC accepté)', 'USD or CDF (FC accepted)') },
      { key: 'CodeBarre', example: L('(optionnel)', '(optional)'), note: L('Code-barres / EAN', 'Barcode / EAN') },
      { key: 'Description', example: L('(optionnel)', '(optional)'), note: L('Texte libre', 'Free text') },
    ];

    // ── Colonnes métier (type d'activité) ──
    const businessCols = businessFields.map((field: any) => {
      let example: any = getFieldPlaceholder(field) || '...';
      if (field.type === 'boolean') example = isEn ? 'Yes / No' : 'Oui / Non';
      if (field.type === 'date') example = 'YYYY-MM-DD';
      if (field.options) example = field.options.map((opt: string, idx: number) => getFieldOptionLabel(field, opt, idx)).join(' / ');
      return { key: getFieldLabel(field), example, note: field.required ? L('Obligatoire', 'Required') : L('Optionnel', 'Optional') };
    });

    const allCols = [...standardCols, ...businessCols];

    // ── Feuille 2 : Produits (ligne d'exemple + en-têtes) ──
    const exampleRow: any = {};
    allCols.forEach((c) => {
      exampleRow[c.key] = c.example;
    });
    const ws = XLSX.utils.json_to_sheet([exampleRow], { header: allCols.map((c) => c.key) });

    // Largeurs de colonnes
    ws['!cols'] = allCols.map((c) => ({ wch: Math.max(c.key.length + 2, String(c.example).length + 4) }));

    // Style en-tête (gras + fond vert)
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = headerRange.s.c; C <= headerRange.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[addr]) continue;
      ws[addr].s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '155E58' } } };
    }

    // Validation de liste pour la colonne Devise
    const deviseIdx = allCols.findIndex((c) => c.key.toLowerCase().includes('devise') || c.key.toLowerCase() === 'currency');
    if (deviseIdx >= 0) {
      ws['!dataValidation'] = ws['!dataValidation'] || [];
      ws['!dataValidation'].push({
        type: 'list',
        formula1: '"USD,CDF,FC"',
        allowBlank: true,
        showErrorMessage: true,
        errorTitle: 'Devise invalide',
        error: 'Utilisez USD, CDF ou FC',
        sqref: `${XLSX.utils.encode_cell({ r: 1, c: deviseIdx })}:${XLSX.utils.encode_cell({ r: 200, c: deviseIdx })}`,
      });
    }

    // ── Feuille 1 : Instructions ──
    const instructions = [
      [L('IMPORT DES PRODUITS — MODE D\'EMPLOI', 'PRODUCT IMPORT — INSTRUCTIONS'), ''],
      ['', ''],
      [L('Étape', 'Step'), L('Détails', 'Details')],
      ['1', L('Remplissez la feuille « Produits » avec vos articles.', 'Fill in the "Products" sheet with your items.')],
      ['2', L('Ne modifiez pas les en-têtes de colonnes (ligne 1).', 'Do not change the column headers (row 1).')],
      ['3', L('Le Nom et le PrixVente sont obligatoires pour chaque ligne.', 'Name and SalePrice are required for each row.')],
      ['4', L('Devise : USD, CDF ou FC. Si vide, la devise par défaut est utilisée.', 'Currency: USD, CDF or FC. If empty, the default currency is used.')],
      ['5', L('Les doublons (même nom ou même code-barres) sont ignorés automatiquement.', 'Duplicates (same name or barcode) are ignored automatically.')],
      ['6', L('Pour les champs à choix (Oui/Non, options), utilisez les valeurs affichées dans l\'en-tête.', 'For choice fields (Yes/No, options), use the values shown in the header.')],
      ['7', L('Dates au format AAAA-MM-JJ (ex: 2026-12-31).', 'Dates as YYYY-MM-DD (e.g. 2026-12-31).')],
      ['8', L('Maximum 1000 produits par import.', 'Maximum 1000 products per import.')],
      ['', ''],
      [L('Exemple', 'Example'), ''],
      [L('Ligne de la feuille Produits :', 'Products sheet row:'), `${allCols.map((c) => c.key + '=' + c.example).join(' | ')}`],
    ];
    const wsInstr = XLSX.utils.aoa_to_sheet(instructions);
    wsInstr['!cols'] = [{ wch: 18 }, { wch: 110 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsInstr, L('Instructions', 'Instructions'));
    XLSX.utils.book_append_sheet(wb, ws, L('Produits', 'Products'));

    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveBlob(blob, (isEn ? 'Product_Import_Template' : 'Modele_Import_Produits') + '.xlsx');
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    if (!isExcel) {
      toast.error(t('invalidExcelFile'));
      if (importInputRef.current) importInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error('No sheet found');
        const sheet = workbook.Sheets[sheetName];
        const parsedData: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!parsedData.length) {
          throw new Error('Empty sheet');
        }

        // ── Normalisation des clés : minuscules, sans accents, espaces retirés ──
        const normalizeKey = (k: string) =>
          String(k)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');

        const pick = (row: any, ...keys: string[]) => {
          const norm = Object.keys(row).reduce((acc: Record<string, any>, k) => {
            acc[normalizeKey(k)] = row[k];
            return acc;
          }, {});
          for (const k of keys) {
            const nk = normalizeKey(k);
            if (norm[nk] !== undefined && norm[nk] !== null && String(norm[nk]).trim() !== '') return norm[nk];
          }
          return undefined;
        };

        const hasRequiredColumns = parsedData.some((row: any) => {
          const name = pick(row, 'Nom', 'Name', 'nom', 'name', 'Produit', 'Product');
          const price = pick(row, 'PrixVente', 'Prix', 'SalePrice', 'Price', 'PU');
          const stock = pick(row, 'Stock', 'Quantite', 'Quantity', 'Qte');
          return name && price !== undefined && stock !== undefined;
        });

        if (!hasRequiredColumns) {
          throw new Error('Missing required columns');
        }

        const activityType = normalizeActivityType(user?.typeActivite);
        const businessFields = BUSINESS_TYPES[activityType]?.fields || [];

        const errors: string[] = [];
        const validProducts: any[] = [];
        const seenNames = new Set<string>();
        const seenBarcodes = new Set<string>();
        let duplicatesInFile = 0;

        parsedData.forEach((row: any, idx: number) => {
          const lineNo = idx + 2; // ligne Excel réelle (en-tête = ligne 1)

          // Ligne vide ou séparateur
          const rawName = pick(row, 'Nom', 'Name', 'nom', 'name', 'Produit', 'Product');
          if (rawName === undefined && !Object.values(row).some((v: any) => v !== undefined && v !== null && String(v).trim() !== '')) return;

          const nom = String(rawName || '').trim();
          if (!nom) {
            errors.push(`${lineNo}: ${language === 'en' ? 'missing product name' : 'nom du produit manquant'}`);
            return;
          }

          const price = Number(pick(row, 'PrixVente', 'Prix', 'SalePrice', 'Price', 'PU'));
          const purchasePrice = Number(pick(row, 'PrixAchat', 'PurchasePrice', 'Cost', 'Cout') || 0);
          const stock = Number(pick(row, 'Stock', 'Quantite', 'Quantity', 'Qte'));
          const devise = normalizeCurrency(String(pick(row, 'Devise', 'Currency', 'Monnaie') || currency));
          const codeBarre = String(pick(row, 'CodeBarre', 'Barcode', 'EAN', 'Code') || '').trim() || null;

          if (!Number.isFinite(price) || price <= 0) {
            errors.push(`${lineNo}: ${language === 'en' ? 'invalid sale price' : 'prix de vente invalide'} (« ${nom} »)`);
            return;
          }
          if (!Number.isFinite(stock) || stock < 0) {
            errors.push(`${lineNo}: ${language === 'en' ? 'invalid stock' : 'stock invalide'} (« ${nom} »)`);
            return;
          }

          // Doublons dans le FICHIER lui-même (même nom ou même code-barres)
          const nameKey = nom.toLowerCase().trim();
          if (seenNames.has(nameKey) || (codeBarre && seenBarcodes.has(codeBarre))) {
            duplicatesInFile++;
            return;
          }
          seenNames.add(nameKey);
          if (codeBarre) seenBarcodes.add(codeBarre);

          const metadata: Record<string, any> = (() => {
            const raw = pick(row, 'Metadata', 'Metadonnees', 'Attributs');
            if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return {}; } }
            return (raw && typeof raw === 'object' ? raw : {});
          })();

          businessFields.forEach((field: any) => {
            const label = getFieldLabel(field);
            const val = pick(row, label, field.name);
            if (val !== undefined && val !== null && String(val).trim() !== '') {
              metadata[field.name] = field.type === 'boolean'
                ? ['oui', 'yes', 'true', '1', 'vrai'].includes(String(val).toLowerCase())
                : val;
            }
          });

          validProducts.push({
            nom,
            categorie: String(pick(row, 'Categorie', 'Category', 'CategorieProduit') || 'Général').trim(),
            prix: Number.isFinite(price) ? price : 0,
            prixAchat: Number.isFinite(purchasePrice) ? purchasePrice : 0,
            stock: Number.isFinite(stock) ? stock : 0,
            devise,
            codeBarre,
            description: String(pick(row, 'Description', 'Descriptif') || '').trim() || '',
            metadata
          });
        });

        if (!validProducts.length) {
          const detail = errors.slice(0, 3).join(' · ');
          toast.error(language === 'en'
            ? `No valid rows to import${detail ? ' — ' + detail : ''}`
            : `Aucune ligne valide à importer${detail ? ' — ' + detail : ''}`);
          return;
        }

        const res = await api.post('/products/bulk', { products: validProducts });
        const importedCount = res.data.success ? res.data.data.length : res.data.length;
        const serverMsg = res.data?.message || '';

        // Rapport d'import détaillé
        const report: string[] = [serverMsg || `${importedCount} ${language === 'en' ? 'products imported' : 'produits importés'}`];
        if (errors.length) {
          report.push(`${errors.length} ${language === 'en' ? 'error(s) ignored' : 'erreur(s) ignorée(s)'}`);
          errors.slice(0, 3).forEach((e) => report.push('  • ' + e));
          if (errors.length > 3) report.push(`  … +${errors.length - 3} autres`);
        }
        if (duplicatesInFile) {
          report.push(`${duplicatesInFile} ${language === 'en' ? 'duplicate(s) in the file ignored' : 'doublon(s) dans le fichier ignoré(s)'}`);
        }
        toast.success(report.join('\n'));
        fetchProducts();
      } catch (err) {
        toast.error(t('importExcelError'));
        console.error(err);
      } finally {
        if (importInputRef.current) importInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleTextImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const validProducts = lines.map(nom => ({
      nom,
      categorie: 'Général',
      prix: 0,
      prixAchat: 0,
      stock: 0,
      devise: currency
    }));

    try {
      const res = await api.post('/products/bulk', { products: validProducts });
      const importedCount = res.data.success ? res.data.data.length : res.data.length;
      toast.success(t('productsImportedCount').replace('{count}', String(importedCount)));
      setShowTextImportModal(false);
      setBulkText('');
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('textImportError'));
    }
  };

  const [newProduct, setNewProduct] = useState({
    nom: '',
    codeBarre: '',
    categorie: '',
    prixAchat: 0,
    prixVente: 0,
    stock: 0,
    stockAlerte: 5,
    description: '',
    devise: currency as string,
    variantes: [] as any[],
    metadata: {} as Record<string, any>
  });

  const [calc, setCalc] = useState({
    packSize: 1,
    totalCost: 0,
    marginPct: 20,
    active: false
  });

  // Auto-calcul des prix basés sur la marge
  useEffect(() => {
    if (calc.active && calc.packSize > 0) {
      const unitAchat = calc.totalCost / calc.packSize;
      const unitVente = unitAchat * (1 + calc.marginPct / 100);

      const roundedAchat = Math.round(unitAchat * 100) / 100;
      const roundedVente = Math.round(unitVente * 100) / 100;

      if (showAddModal) {
        setNewProduct((prev: any) => ({ ...prev, prixAchat: roundedAchat, prixVente: roundedVente }));
      } else if (showEditModal && selectedProduct) {
        setSelectedProduct((prev: any) => ({ ...prev, prixAchat: roundedAchat, prix: roundedVente }));
      }
    }
  }, [calc.totalCost, calc.packSize, calc.marginPct, calc.active, showAddModal, showEditModal]);

  // Réinitialiser le calculateur lors de la fermeture des modals
  useEffect(() => {
    if (!showAddModal && !showEditModal) {
      setCalc({ packSize: 1, totalCost: 0, marginPct: 20, active: false });
    }
  }, [showAddModal, showEditModal]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // M6 Fix: Ajout d'un timestamp pour forcer le Service Worker à ignorer le cache
      const response = await api.get(`/products?_t=${Date.now()}`);
      const resData = response.data;

      let productsList = [];

      // Handle standardized response structure: { success: true, data: { data: [], pagination: {} } }
      if (resData.success && resData.data) {
        if (Array.isArray(resData.data.data)) {
          productsList = resData.data.data;
        } else if (Array.isArray(resData.data)) {
          productsList = resData.data;
        } else if (typeof resData.data === 'object') {
          // Check if it's nested like { data: { products: [] } }
          productsList = resData.data.products || resData.data.items || [];
        }
      }
      // Fallback for older/direct structures
      else {
        const data = resData;
        if (Array.isArray(data)) productsList = data;
        else if (data && Array.isArray(data.data)) productsList = data.data;
        else if (data && Array.isArray(data.products)) productsList = data.products;
      }

      setAllProducts(productsList);
      setProducts(productsList);
            setLoadError(false);
    } catch (error) {
      console.error(error);
      setLoadError(true); toast.error(t('productsLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchProductHistory = async (id: number) => {
    try {
      const { data } = await api.get(`/products/${id}/history?_t=${Date.now()}`);
      setProductHistory(data);
      setHistoryPage(1);
      setShowHistoryModal(true);
    } catch (error) {
      console.error(error);
      toast.error(t('stockHistoryError'));
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Search logic
  useEffect(() => {
    const q=searchTerm.trim().toLowerCase().replace(/^#/,'');
    const filtered=allProducts.filter((p:any)=>{
      const match=[p.nom,p.categorie,p.codeBarre,p.id,String(p.id).padStart(5,'0')].some(v=>String(v??'').toLowerCase().includes(q));
      const stock=Number(p.stock),threshold=Number(p.stockAlerte??5);
      return match&&(!categoryFilter||p.categorie===categoryFilter)&&(stockFilter==='ALL'||stockFilter==='OUT'&&stock<=0||stockFilter==='LOW'&&stock>0&&stock<threshold||stockFilter==='OK'&&stock>0&&stock>=threshold);
    }).sort((a,b)=>sort==='stock'?Number(a.stock)-Number(b.stock):sort==='new'?Number(b.id)-Number(a.id):String(a.nom??'').localeCompare(String(b.nom??'')));
    setProducts(filtered);
    setCurrentPage(1); // Reset to page 1 on search
  }, [searchTerm, allProducts,stockFilter,categoryFilter,sort]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = products.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1,Math.ceil(products.length / itemsPerPage));

  // Regroupe les variantes par nom et fusionne les valeurs uniques.
  // Ex: [RAM:6GB, SSD:1TR, SSD:1TR, RAM:6GB, RAM:8GB] -> [RAM: "6GB, 8GB", SSD: "1TR"]
  const normalizeVariantesForSave = (variantes: any[] = []): { nom: string; valeur: string }[] => {
    const map: Record<string, string[]> = {};
    (Array.isArray(variantes) ? variantes : []).forEach((v: any) => {
      if (!v || !v.nom) return;
      const nom = String(v.nom).trim();
      if (!nom) return;
      const valeurs = String(v.valeur || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
      if (!map[nom]) map[nom] = [];
      valeurs.forEach((val: string) => { if (!map[nom].includes(val)) map[nom].push(val); });
    });
    return Object.entries(map).map(([nom, valeurs]) => ({ nom, valeur: valeurs.join(', ') }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    // Normaliser les variantes : regrouper par nom et fusionner les valeurs uniques
    const normalizedProduct = {
      ...newProduct,
      variantes: normalizeVariantesForSave(newProduct.variantes)
    };
    Object.entries(normalizedProduct).forEach(([key, value]) => {
      if (key === 'codeBarre' && !value) return;
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value.toString());
    });
    if (selectedImage) formData.append('image', selectedImage);

    try {
      await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(t('productAddedNamed').replace('{name}', newProduct.nom));
      setShowAddModal(false);
      setNewProduct({
        nom: '', codeBarre: '', categorie: 'Général', prixVente: 0, prixAchat: 0, stock: 0, stockAlerte: 5, description: '', devise: currency, variantes: [], metadata: {}
      });
      setCalc({ packSize: 1, totalCost: 0, marginPct: 20, active: false });
      setSelectedImage(null);
      setImagePreview(null);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('productAddError'));
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    // Normaliser les variantes à l'édition aussi
    const normalizedProduct = {
      ...selectedProduct,
      variantes: normalizeVariantesForSave(selectedProduct.variantes)
    };
    Object.entries(normalizedProduct).forEach(([key, value]) => {
      // Don't skip codeBarre if it has a value
      if (key !== 'image' && value !== null && value !== undefined) {
        if (key === 'variantes' || key === 'metadata') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    if (selectedImage) formData.append('image', selectedImage);

    try {
      await api.put(`/products/${selectedProduct.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(t('productUpdatedNamed').replace('{name}', selectedProduct.nom));
      setShowEditModal(false);
      setSelectedImage(null);
      setImagePreview(null);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('productUpdateError'));
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Supprimer Produit",
      message: `Voulez-vous vraiment supprimer le produit "${name}" ? Cette action est irréversible.`,
      onConfirm: async () => {
        try {
          await api.delete(`/products/${id}`);
          toast.success(t('productDeleted'));
          fetchProducts();
        } catch (error: any) {
          toast.error(t('deleteError'));
        }
      }
    });
  };

  const handleAllDelete = async () => {
    setConfirmModal({
      isOpen: true,
      title: "SUPPRESSION TOTALE",
      message: "ATTENTION : Voulez-vous vraiment supprimer TOUS les produits de votre catalogue ? Cette action est irréversible.",
      onConfirm: async () => {
        try {
          await api.delete('/products/all');
          toast.success(t('catalogCleared'));
          fetchProducts();
        } catch (error: any) {
          toast.error(t('bulkDeleteError'));
        }
      }
    });
  };

  const totalProducts = allProducts.length;
  const lowStockCount = allProducts.filter((p: any) => p.stock < (p.stockAlerte ?? 5)).length;
  const outOfStockCount = allProducts.filter((p: any) => p.stock <= 0).length;
  const uniqueCategories = Array.from(new Set(allProducts.map((p: any) => p.categorie).filter(Boolean)));

  if (!loading && loadError) return <LoadFailure onRetry={fetchProducts} />;
    return (
    <motion.div className="ic-page ic-products"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}
    >
      <div className="responsive-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '900', fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase' }}>
            <Boxes size={14} /> {t('globalInventory')}
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, letterSpacing: '-0.04em', margin: 0 }}>
            {t('productsStock').split(' & ')[0]} & <span className="text-gradient">{t('productsStock').split(' & ')[1] || 'Stock'}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t('inventoryDesc')}</p>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div className="glass stats-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', minWidth: 'clamp(140px, 20vw, 180px)', flex: '1 1 140px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Layers size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>{t('items')}</span>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>{totalProducts}</div>
            </div>
          </div>

          <div className="glass stats-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', minWidth: 'clamp(160px, 22vw, 220px)', flex: '1 1 160px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>{t('stockValueSale')}</span>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--success)' }}>
                {allProducts.reduce((acc, p) => acc + (convertPrice(p.prix || 0, p.devise || currency, currency) * (p.stock || 0)), 0).toLocaleString()} <span style={{ fontSize: '0.7rem' }}>{currency}</span>
              </div>
            </div>
          </div>

          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <div className="glass stats-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', minWidth: 'clamp(160px, 22vw, 220px)', flex: '1 1 160px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                <Package size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>{t('totalCostPurchase')}</span>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--warning)' }}>
                  {allProducts.reduce((acc, p) => acc + (convertPrice(p.prixAchat || 0, p.devise || currency, currency) * (p.stock || 0)), 0).toLocaleString()} <span style={{ fontSize: '0.7rem' }}>{currency}</span>
                </div>
              </div>
            </div>
          )}

          {lowStockCount > 0 && (
            <div className="glass stats-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', minWidth: 'clamp(140px, 20vw, 180px)', flex: '1 1 140px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Alertes Stock</span>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--danger)' }}>{lowStockCount}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass products-controls lumo-inventory-toolbar" style={{ padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '16px', alignItems: 'center', border: '1px solid var(--border)', background: 'var(--bg-card)', flexWrap: 'wrap' }}>
        <div className="mobile-search-wrap" style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={22} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('searchReferenceCategory')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 16px 16px 60px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-main)',
              fontWeight: '600',
              outline: 'none',
              fontSize: '1rem'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input type="file" ref={importInputRef} accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: 'none' }} />
          {canDo('products.import') && (
          <>
          <button onClick={handleDownloadTemplate} className="glass btn-hover" style={{ padding: '0 24px', height: '48px', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid var(--border)', fontWeight: '600' }} title={t('downloadExcelTemplate')}>
            <Download size={18} /> {t('template')}
          </button>
          <button onClick={() => importInputRef.current?.click()} className="glass btn-hover" style={{ padding: '0 24px', height: '48px', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid var(--border)', fontWeight: '600' }} title={t('importExcelFile')}>
            <Upload size={18} /> {t('excel')}
          </button>
          <button onClick={() => setShowTextImportModal(true)} className="glass btn-hover" style={{ padding: '0 24px', height: '48px', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid var(--border)', fontWeight: '600' }}>
            <FileText size={18} /> {t('text')}
          </button>
          </>
          )}
          {(canDo('products.export') || canDo('products.add')) && (
          <button onClick={handleExportExcel} className="glass btn-hover" style={{ padding: '0 24px', height: '48px', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid var(--border)', fontWeight: '600' }}>
            <Download size={18} /> {t('report')}
          </button>
          )}
          <button onClick={fetchProducts} className="glass btn-hover" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--border)' }}>
            <RefreshCw size={18} />
          </button>
          {canDo('products.add') && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '0 32px', height: '48px', borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary)', color: 'white',
                border: 'none', fontWeight: '600', cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                fontSize: '0.95rem'
              }}
            >
              <Plus size={20} /> {t('newProduct') || 'Nouveau Produit'}
            </button>
          )}
        </div>
      </div>

      <div className="ic-filters"><label>{language==='en'?'Stock':'Stock'}<select value={stockFilter} onChange={e=>setStockFilter(e.target.value)}><option value="ALL">{language==='en'?'All statuses':'Tous les états'}</option><option value="OUT">{language==='en'?'Out of stock':'Rupture'}</option><option value="LOW">{language==='en'?'Low stock':'Stock faible'}</option><option value="OK">{language==='en'?'Available above threshold':'Disponible au seuil'}</option></select></label><label>{language==='en'?'Category':'Catégorie'}<select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="">{language==='en'?'All categories':'Toutes les catégories'}</option>{uniqueCategories.map(v=><option key={String(v)} value={String(v)}>{String(v)}</option>)}</select></label><label>{language==='en'?'Sort':'Trier'}<select value={sort} onChange={e=>setSort(e.target.value)}><option value="name">{language==='en'?'Name A–Z':'Nom A–Z'}</option><option value="stock">{language==='en'?'Lowest stock':'Stock croissant'}</option><option value="new">{language==='en'?'Newest reference':'Référence récente'}</option></select></label><div className="ic-view-switch"><button aria-pressed={view==='table'} onClick={()=>setView('table')}>{language==='en'?'Table':'Tableau'}</button><button aria-pressed={view==='grid'} onClick={()=>setView('grid')}>{language==='en'?'Cards':'Grille'}</button></div></div>
      {/* Table Section */}
      <div className="glass" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
        {view==='grid'?<div className="ic-grid">{loading?<PageSkeleton/>:!currentItems.length?<p className="ic-empty">{language==='en'?'No matching products':'Aucun produit correspondant'}</p>:currentItems.map((p:any)=><article className="ic-card" key={p.id}><div className="ic-product-photo">{p.image?<img src={p.image} alt={p.nom} loading="lazy" decoding="async"/>:<Package size={32}/>}</div><div className="ic-card-body"><small>#{p.id} · {p.categorie||'—'}</small><h3>{p.nom}</h3>{p.codeBarre&&<small>{p.codeBarre}</small>}<div className="ic-product-meta"><strong>{Number(p.prix||0).toLocaleString()} {p.devise||currency}</strong><span className={'ic-stock '+(Number(p.stock)<=0?'out':Number(p.stock)<Number(p.stockAlerte??5)?'low':'ok')}>{p.stock} {language==='en'?'units':'unités'}</span></div>{isPharmacy&&<small>{language==='en'?'Expiration':'Péremption'} : {p.datePeremption?new Date(p.datePeremption).toLocaleDateString():'—'}</small>}{canDo('products.view_purchase_price')&&<small>{language==='en'?'Purchase price':'Prix achat'} : {Number(p.prixAchat||0).toLocaleString()} {p.devise||currency}</small>}<div className="ic-card-actions"><button title={language==='en'?'History':'Historique'} aria-label={language==='en'?'History':'Historique'} onClick={()=>{setSelectedProduct(p);fetchProductHistory(p.id)}}><Activity size={17}/></button>{canDo('products.edit')&&<button title={language==='en'?'Edit':'Modifier'} aria-label={language==='en'?'Edit':'Modifier'} onClick={()=>{setSelectedProduct({...p,metadata:p.metadata||{}});setShowEditModal(true)}}><Edit size={17}/></button>}{canDo('products.delete')&&<button title={language==='en'?'Delete':'Supprimer'} aria-label={language==='en'?'Delete':'Supprimer'} onClick={()=>handleDeleteProduct(p.id,p.nom)}><Trash2 size={17}/></button>}</div></div></article>)}</div>:<div style={{ overflowX: 'auto' }}>
          <table className="table-products" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                <th style={{ padding: '16px 24px' }}>{t('productReference') || 'Référence Produit'}</th>
                <th style={{ padding: '16px 24px' }}>{t('category') || 'Catégorie'}</th>
                {isPharmacy && <th style={{ padding: '16px 24px' }}>{t('expiration') || 'Péremption'}</th>}
                <th style={{ padding: '16px 24px' }}>{t('unitPrice') || 'Prix Unitaire'}</th>
                <th style={{ padding: '16px 24px' }}>{t('stockLevel') || 'Niveau de Stock'}</th>
                <th style={{ padding: '16px 24px' }}>{t('status') || 'Statut'}</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}>{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isPharmacy ? 7 : 6} style={{ padding: '60px', textAlign: 'center' }}>
                  <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto', opacity: 0.5 }} />
                </td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={isPharmacy ? 7 : 6} style={{ padding: '60px', textAlign: 'center' }}>
                  <Package size={60} style={{ opacity: 0.1, marginBottom: '24px', margin: '0 auto', color: 'var(--text-muted)' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-muted)' }}>{t('emptyInventory') || 'Inventaire vide'}</h3>
                  <p style={{ color: 'var(--text-muted)', fontWeight: '500', marginTop: '8px' }}>{t('noProductsMatchSearch') || 'Aucun produit ne correspond à votre recherche.'}</p>
                </td></tr>
              ) : currentItems.map((p: any) => (
                <motion.tr
                  key={p.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.3s' }}
                  className="hover-row"
                >
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', fontSize: '1.2rem', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                        {p.image ? (
                          <img src={p.image} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          String(p.nom||'?').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1rem' }}>{p.nom}</div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>REF: #{p.id.toString().padStart(5, '0')}</div>
                          {p.codeBarre && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'var(--primary-glow)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Zap size={10} fill="var(--primary)" /> {p.codeBarre}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem' }}>
                      <Tag size={14} color="var(--primary)" /> {p.categorie}
                    </div>
                  </td>
                  {isPharmacy && (
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.9rem', color: (p.datePeremption && new Date(p.datePeremption) < new Date()) ? 'var(--danger)' : 'var(--text-main)' }}>
                        <Calendar size={14} /> {p.datePeremption ? new Date(p.datePeremption).toLocaleDateString() : '—'}
                        {p.datePeremption && new Date(p.datePeremption) < new Date() && <AlertCircle size={14} />}
                      </div>
                    </td>
                  )}
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--primary)' }}>
                      {convertPrice(p.prix || 0, p.devise || currency, currency).toLocaleString()} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{currency}</span>
                    </div>
                    {p.devise && p.devise !== currency && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                        Orig: {p.prix?.toLocaleString()} {p.devise}
                      </div>
                    )}
                    {canDo('products.view_purchase_price') && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500', marginTop: '4px' }}>Achat: {convertPrice(p.prixAchat || 0, p.devise || currency, currency).toLocaleString()} {currency}</div>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                        backgroundColor: p.stock < (p.stockAlerte ?? 5) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        border: `1px solid ${p.stock < (p.stockAlerte ?? 5) ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                      }}>
                        <span style={{ fontWeight: '700', fontSize: '1rem', color: p.stock < (p.stockAlerte ?? 5) ? 'var(--danger)' : 'var(--success)' }}>{p.stock}</span>
                        <span style={{ fontSize: '0.75rem', marginLeft: '6px', fontWeight: '600', opacity: 0.7 }}>{t('units') || 'unités'}</span>
                      </div>
                      {p.stock < (p.stockAlerte ?? 5) && <AlertTriangle size={18} color="var(--danger)" className="animate-pulse" />}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{
                      display: 'inline-flex', padding: '6px 12px',
                      borderRadius: '100px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      backgroundColor: p.stock > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: p.stock > 0 ? 'var(--success)' : 'var(--danger)',
                      textTransform: 'uppercase',
                      border: '1px solid currentColor',
                      letterSpacing: '0.05em'
                    }}>
                      {p.stock > 0 ? (t('available') || 'Disponible') : (t('outOfStock') || 'En Rupture')}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => { setSelectedProduct(p); fetchProductHistory(p.id); }}
                        className="glass btn-hover"
                        style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title={t('stockHistoryNav') || 'Historique du stock'}
                      >
                        <Activity size={18} />
                      </button>
                      {canDo('products.edit') && (
                        <button
                          onClick={() => { setSelectedProduct({ ...p, metadata: p.metadata || {} }); setShowEditModal(true); }}
                          className="glass btn-hover"
                          style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {canDo('products.delete') && (
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.nom)}
                          className="glass btn-hover"
                          style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>}

        <div className="ic-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', padding: '0 12px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
            Affichage de <span style={{ color: 'var(--text-main)' }}>{products.length?indexOfFirstItem+1:0}</span> à <span style={{ color: 'var(--text-main)' }}>{Math.min(indexOfLastItem, products.length)}</span> sur <span style={{ color: 'var(--text-main)' }}>{products.length}</span> produits
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-hover"
              style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontWeight: 700 }}
            >
              Précédent
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (totalPages > 5 && Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>...</span>;
                return null;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: currentPage === pageNum ? 'var(--primary)' : 'var(--bg-card)',
                    color: currentPage === pageNum ? 'white' : 'var(--text-main)',
                    fontWeight: 800, cursor: 'pointer', border: currentPage === pageNum ? 'none' : '1px solid var(--border)'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-hover"
              style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, fontWeight: 700 }}
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      <datalist id="categoryList">
        {uniqueCategories.map(cat => (
          <option key={cat as string} value={cat as string} />
        ))}
      </datalist>

      {/* Modal Import Texte */}
      <Modal
        isOpen={showTextImportModal}
        onClose={() => setShowTextImportModal(false)}
        title={t('quickImport')}
        subtitle="Collez votre liste d'articles (un article par ligne)"
        maxWidth="600px"
        icon={FileText}
      >
        <form onSubmit={handleTextImport} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Liste de produits</label>
            <textarea
              required
              placeholder="Laptop HP&#10;JBL Boombox&#10;iPhone 15 Pro"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                fontWeight: '500',
                outline: 'none',
                minHeight: '200px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
            <button type="button" onClick={() => setShowTextImportModal(false)} className="btn-hover" style={{ padding: '12px 24px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem', borderRadius: 'var(--radius-sm)' }}>{t('cancelBtn')}</button>
            <button type="submit" className="btn-hover" style={{ padding: '12px 32px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={18} /> Importer {bulkText.split('\n').filter(l => l.trim().length > 0).length > 0 ? `(${bulkText.split('\n').filter(l => l.trim().length > 0).length})` : ''}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ajout */}
      <Modal
        isOpen={showAddModal}

        onClose={() => setShowAddModal(false)}
        title={t('newProduct')}
        subtitle="Enregistrez une nouvelle référence dans votre catalogue Lumos."
        maxWidth="800px"
        icon={PackageCheck}
      >
        <form onSubmit={handleAddProduct} className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="responsive-grid" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Désignation / Nom de l'article</label>
              <div style={{ position: 'relative' }}>
                <Package style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input required type="text" placeholder="ex: Laptop HP Spectre x360" value={newProduct.nom} onChange={(e) => setNewProduct({ ...newProduct, nom: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '600', outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Code-barres / SKU</label>
              <div style={{ position: 'relative' }}>
                <Activity style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input type="text" placeholder="Scannez ou saisissez le code..." value={newProduct.codeBarre} onChange={(e) => setNewProduct({ ...newProduct, codeBarre: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '600', outline: 'none' }} />
              </div>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Image du Produit (Optionnel)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {imagePreview ? <img src={imagePreview || undefined} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Upload size={22} color="var(--text-muted)" />}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)', background: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                Choisir une image
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Groupe / Catégorie</label>
            <div style={{ position: 'relative' }}>
              <Tag style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={18} />
              <input list="categoryList" type="text" placeholder="ex: Electronique" value={newProduct.categorie} onChange={(e) => setNewProduct({ ...newProduct, categorie: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '600', outline: 'none' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Devise</label>
            <div style={{ position: 'relative' }}>
              <select
                value={newProduct.devise}
                onChange={(e) => {
                  const oldDevise = newProduct.devise;
                  const newDevise = e.target.value;
                  if (oldDevise !== newDevise) {
                    const newPrix = convertPrice(newProduct.prixVente, oldDevise, newDevise);
                    const newPrixAchat = convertPrice(newProduct.prixAchat, oldDevise, newDevise);
                    setNewProduct({ ...newProduct, devise: newDevise, prixVente: newPrix, prixAchat: newPrixAchat });
                    setConversionBanner(`Prix convertis : ${oldDevise} → ${newDevise} (taux: 1 USD = ${exchangeRate.toLocaleString()} CDF)`);
                    setTimeout(() => setConversionBanner(null), 4000);
                  }
                }}
                style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '600', outline: 'none', appearance: 'none', cursor: 'pointer' }}
              >
                <option value="CDF">Francs Congolais (CDF)</option>
                <option value="USD">Dollars (USD)</option>
              </select>
            </div>
            {conversionBanner && showAddModal && (
              <div style={{ marginTop: '10px', padding: '10px 16px', borderRadius: '12px', background: 'rgba(21,94,88,0.1)', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '700' }}>
                {conversionBanner}
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Stock de départ</label>
            <div style={{ position: 'relative' }}>
              <Boxes style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={18} />
              <input type="number" required value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })} style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: '700', outline: 'none' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Seuil d'Alerte Stock</label>
            <div style={{ position: 'relative' }}>
              <AlertTriangle style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--warning)', opacity: 0.5 }} size={18} />
              <input type="number" required value={newProduct.stockAlerte} onChange={(e) => setNewProduct({ ...newProduct, stockAlerte: parseInt(e.target.value) })} style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: '700', outline: 'none' }} />
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', background: 'var(--primary-glow)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} /> Système de Marge Automatique
              </h4>
              <label className="switch" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>{calc.active ? 'Activé' : 'Désactivé'}</span>
                <input type="checkbox" checked={calc.active} onChange={(e) => setCalc({ ...calc, active: e.target.checked })} style={{ width: '40px', height: '20px' }} />
              </label>
            </div>

            {calc.active && (
              <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Pièces / Carton (Lot)</label>
                  <input type="number" value={calc.packSize} onChange={(e) => setCalc({ ...calc, packSize: parseFloat(e.target.value) || 1 })} style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Prix du Carton ({newProduct.devise})</label>
                  <input type="number" value={calc.totalCost} onChange={(e) => setCalc({ ...calc, totalCost: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Marge (%)</label>
                  <input type="number" value={calc.marginPct} onChange={(e) => setCalc({ ...calc, marginPct: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' }} />
                </div>
              </div>
            )}
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px', fontWeight: '500' }}>
              L'activation de ce système calculera automatiquement votre P.A (Prix d'Achat Unitaire) et votre P.V (Prix de Vente) selon la marge définie.
            </p>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Prix d'Achat ({newProduct.devise})</label>
            <div style={{ position: 'relative' }}>
              <TrendingDown style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--danger)', opacity: 0.5 }} size={18} />
              <input type="number" required readOnly={calc.active} value={isNaN(newProduct.prixAchat) ? '' : newProduct.prixAchat} onChange={(e) => setNewProduct({ ...newProduct, prixAchat: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: calc.active ? 'rgba(0,0,0,0.05)' : 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: '700', outline: 'none' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Prix de Vente ({newProduct.devise})</label>
            <div style={{ position: 'relative' }}>
              <TrendingUp style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--success)', opacity: 0.5 }} size={18} />
              <input type="number" required readOnly={calc.active} value={isNaN(newProduct.prixVente) ? '' : newProduct.prixVente} onChange={(e) => setNewProduct({ ...newProduct, prixVente: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: calc.active ? 'rgba(0,0,0,0.05)' : 'var(--bg-main)', color: 'var(--success)', fontSize: '0.95rem', fontWeight: '800', outline: 'none' }} />
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'block', marginLeft: '4px' }}>{t('variantsLabel')}</label>
            <p style={{ margin: '0 0 12px 4px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('variantsHint')}</p>
            {/* En-têtes de colonnes */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '6px', padding: '0 4px' }}>
              <span style={{ flex: 1, fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{language === 'en' ? 'Characteristic' : 'Caractéristique'}</span>
              <span style={{ flex: 1.4, fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{language === 'en' ? 'Options (comma separated)' : 'Choix possibles (séparés par virgule)'}</span>
              <span style={{ width: '24px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {newProduct.variantes.map((v, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px' }}>
                  <input placeholder={t('variantNamePlaceholder')} value={v.nom} onChange={e => {
                    const newV = [...newProduct.variantes];
                    newV[i].nom = e.target.value;
                    setNewProduct({ ...newProduct, variantes: newV });
                  }} style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' }} />
                  <input placeholder={t('variantValuePlaceholder')} value={v.valeur} onChange={e => {
                    const newV = [...newProduct.variantes];
                    newV[i].valeur = e.target.value;
                    setNewProduct({ ...newProduct, variantes: newV });
                  }} style={{ flex: 1.4, padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' }} />
                  <button type="button" onClick={() => setNewProduct({ ...newProduct, variantes: newProduct.variantes.filter((_, idx) => idx !== i) })} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={18} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setNewProduct({ ...newProduct, variantes: [...newProduct.variantes, { nom: '', valeur: '' }] })} style={{ alignSelf: 'flex-start', padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--primary)', color: 'var(--primary)', fontWeight: '700', background: 'none', cursor: 'pointer' }}>{t('addVariantBtn')}</button>
            </div>
            {/* Aperçu type Alibaba */}
            {newProduct.variantes.some(v => v.nom && v.valeur) && (
              <div style={{ marginTop: '14px', padding: '14px', borderRadius: '14px', background: 'rgba(21,94,88,0.05)', border: '1px solid rgba(21,94,88,0.15)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>{t('variantsPreviewTitle')}</div>
                {normalizeVariantesForSave(newProduct.variantes).map((v: any, vi: number) => (
                  <div key={vi} style={{ marginBottom: vi < newProduct.variantes.length - 1 ? '10px' : 0 }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>{v.nom}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {String(v.valeur).split(',').map((opt: string) => (
                        <span key={opt.trim()} style={{ padding: '5px 12px', borderRadius: '8px', border: '1.5px solid var(--primary)', background: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem' }}>{opt.trim()}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {BUSINESS_TYPES[normalizeActivityType(user?.typeActivite)]?.fields.map((field) => (
            <div key={field.name}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{getFieldLabel(field)}</label>
              <div style={{ position: 'relative' }}>
                {field.type === 'select' ? (
                  <select
                    value={newProduct.metadata?.[field.name] || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, metadata: { ...newProduct.metadata, [field.name]: e.target.value } })}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '600', outline: 'none', appearance: 'none' }}
                  >
                    <option value="">{language === 'en' ? 'Select...' : 'Selectionnez...'}</option>
                    {field.options?.map((opt, idx) => <option key={opt} value={opt}>{getFieldOptionLabel(field, opt, idx)}</option>)}
                  </select>
                ) : field.type === 'boolean' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!newProduct.metadata?.[field.name]} onChange={(e) => setNewProduct({ ...newProduct, metadata: { ...newProduct.metadata, [field.name]: e.target.checked } })} style={{ width: '18px', height: '18px' }} />
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{getFieldLabel(field)}</span>
                  </label>
                ) : (
                  <input
                    type={field.type}
                    placeholder={getFieldPlaceholder(field)}
                    required={field.required}
                    value={newProduct.metadata?.[field.name] || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, metadata: { ...newProduct.metadata, [field.name]: e.target.value } })}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '600', outline: 'none' }}
                  />
                )}
              </div>
            </div>
          ))}

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-hover" style={{ padding: '12px 24px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', borderRadius: 'var(--radius-sm)' }}>Fermer</button>
            <button type="submit" className="btn-hover" style={{ padding: '12px 32px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} /> Créer l'Article
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edition */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('updateArticle')}
        subtitle="Ajustez les détails de votre référence produit."
        maxWidth="800px"
        icon={Edit}
      >
        {selectedProduct && (
          <form onSubmit={handleUpdateProduct} className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="responsive-grid" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Désignation / Nom de l'article</label>
                <div style={{ position: 'relative' }}>
                  <Package style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                  <input required type="text" value={selectedProduct.nom} onChange={(e) => setSelectedProduct({ ...selectedProduct, nom: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '600', outline: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Code-barres / SKU</label>
                <div style={{ position: 'relative' }}>
                  <Activity style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                  <input type="text" placeholder="Scannez ou saisissez le code..." value={selectedProduct.codeBarre || ''} onChange={(e) => setSelectedProduct({ ...selectedProduct, codeBarre: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '600', outline: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Image du Produit</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {imagePreview ? <img src={imagePreview || undefined} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                    selectedProduct.image ? <img src={selectedProduct.image || undefined} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Upload size={22} color="var(--text-muted)" />
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)', background: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                  Modifier l'image
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Catégorie</label>
              <div style={{ position: 'relative' }}>
                <Tag style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={18} />
                <input list="categoryList" type="text" value={selectedProduct.categorie} onChange={(e) => setSelectedProduct({ ...selectedProduct, categorie: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '600', outline: 'none' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Devise</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedProduct.devise || currency}
                  onChange={(e) => {
                    const oldDevise = selectedProduct.devise || currency;
                    const newDevise = e.target.value;
                    if (oldDevise !== newDevise) {
                      const newPrix = convertPrice(parseFloat(selectedProduct.prix) || 0, oldDevise, newDevise);
                      const newPrixAchat = convertPrice(parseFloat(selectedProduct.prixAchat) || 0, oldDevise, newDevise);
                      setSelectedProduct({ ...selectedProduct, devise: newDevise, prix: newPrix, prixAchat: newPrixAchat });
                      setConversionBanner(`Prix convertis : ${oldDevise} → ${newDevise} (taux: 1 USD = ${exchangeRate.toLocaleString()} CDF)`);
                      setTimeout(() => setConversionBanner(null), 4000);
                    }
                  }}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '600', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="CDF">Francs Congolais (CDF)</option>
                  <option value="USD">Dollars (USD)</option>
                </select>
              </div>
              {conversionBanner && showEditModal && (
                <div style={{ marginTop: '10px', padding: '10px 16px', borderRadius: '12px', background: 'rgba(21,94,88,0.1)', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '700' }}>
                  {conversionBanner}
                </div>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1', background: 'var(--primary-glow)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} /> Système de Marge Automatique
                </h4>
                <label className="switch" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>{calc.active ? 'Activé' : 'Désactivé'}</span>
                  <input type="checkbox" checked={calc.active} onChange={(e) => setCalc({ ...calc, active: e.target.checked })} style={{ width: '40px', height: '20px' }} />
                </label>
              </div>

              {calc.active && (
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Qté (ex: 12 pcs)</label>
                    <input type="number" value={calc.packSize} onChange={(e) => setCalc({ ...calc, packSize: parseFloat(e.target.value) || 1 })} style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Coût Total ({selectedProduct.devise || currency})</label>
                    <input type="number" value={calc.totalCost} onChange={(e) => setCalc({ ...calc, totalCost: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Marge (%)</label>
                    <input type="number" value={calc.marginPct} onChange={(e) => setCalc({ ...calc, marginPct: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' }} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Stock Actuel</label>
              <div style={{ position: 'relative' }}>
                <Boxes style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={18} />
                <input type="number" required value={selectedProduct.stock} onChange={(e) => setSelectedProduct({ ...selectedProduct, stock: parseInt(e.target.value) })} style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: '700', outline: 'none' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Seuil d'Alerte</label>
              <div style={{ position: 'relative' }}>
                <AlertTriangle style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--warning)', opacity: 0.5 }} size={18} />
                <input type="number" required value={selectedProduct.stockAlerte} onChange={(e) => setSelectedProduct({ ...selectedProduct, stockAlerte: parseInt(e.target.value) })} style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: '700', outline: 'none' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Prix d'Achat ({selectedProduct?.devise || currency})</label>
              <div style={{ position: 'relative' }}>
                <TrendingDown style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--danger)', opacity: 0.5 }} size={18} />
                <input type="number" required readOnly={calc.active} value={isNaN(selectedProduct.prixAchat) ? '' : selectedProduct.prixAchat} onChange={(e) => setSelectedProduct({ ...selectedProduct, prixAchat: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: calc.active ? 'rgba(0,0,0,0.05)' : 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: '700', outline: 'none' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Prix de Vente ({selectedProduct?.devise || currency})</label>
              <div style={{ position: 'relative' }}>
                <TrendingUp style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--success)', opacity: 0.5 }} size={18} />
                <input type="number" required readOnly={calc.active} value={isNaN(selectedProduct.prix) ? '' : (selectedProduct.prix || '')} onChange={(e) => setSelectedProduct({ ...selectedProduct, prix: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: calc.active ? 'rgba(0,0,0,0.05)' : 'var(--bg-main)', color: 'var(--success)', fontSize: '0.95rem', fontWeight: '800', outline: 'none' }} />
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'block', marginLeft: '4px' }}>{t('variantsLabel')}</label>
              <p style={{ margin: '0 0 12px 4px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('variantsHint')}</p>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '6px', padding: '0 4px' }}>
                <span style={{ flex: 1, fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{language === 'en' ? 'Characteristic' : 'Caractéristique'}</span>
                <span style={{ flex: 1.4, fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{language === 'en' ? 'Options (comma separated)' : 'Choix possibles (séparés par virgule)'}</span>
                <span style={{ width: '24px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(selectedProduct.variantes || []).map((v: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '10px' }}>
                    <input placeholder={t('variantNamePlaceholder')} value={v.nom} onChange={e => {
                      const newV = [...selectedProduct.variantes];
                      newV[i].nom = e.target.value;
                      setSelectedProduct({ ...selectedProduct, variantes: newV });
                    }} style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' }} />
                    <input placeholder={t('variantValuePlaceholder')} value={v.valeur} onChange={e => {
                      const newV = [...selectedProduct.variantes];
                      newV[i].valeur = e.target.value;
                      setSelectedProduct({ ...selectedProduct, variantes: newV });
                    }} style={{ flex: 1.4, padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' }} />
                    <button type="button" onClick={() => setSelectedProduct({ ...selectedProduct, variantes: selectedProduct.variantes.filter((_: any, idx: number) => idx !== i) })} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={18} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setSelectedProduct({ ...selectedProduct, variantes: [...(selectedProduct.variantes || []), { nom: '', valeur: '' }] })} style={{ alignSelf: 'flex-start', padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--primary)', color: 'var(--primary)', fontWeight: '700', background: 'none', cursor: 'pointer' }}>{t('addVariantBtn')}</button>
              </div>
              {/* Aperçu type Alibaba */}
              {(selectedProduct.variantes || []).some((v: any) => v.nom && v.valeur) && (
                <div style={{ marginTop: '14px', padding: '14px', borderRadius: '14px', background: 'rgba(21,94,88,0.05)', border: '1px solid rgba(21,94,88,0.15)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>{t('variantsPreviewTitle')}</div>
                  {normalizeVariantesForSave(selectedProduct.variantes).map((v: any, vi: number) => (
                    <div key={vi} style={{ marginBottom: vi < selectedProduct.variantes.length - 1 ? '10px' : 0 }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>{v.nom}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {String(v.valeur).split(',').map((opt: string) => (
                          <span key={opt.trim()} style={{ padding: '5px 12px', borderRadius: '8px', border: '1.5px solid var(--primary)', background: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem' }}>{opt.trim()}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {BUSINESS_TYPES[normalizeActivityType(user?.typeActivite)]?.fields.map((field) => (
              <div key={field.name}>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{getFieldLabel(field)}</label>
                <div style={{ position: 'relative' }}>
                  {field.type === 'select' ? (
                    <select
                      value={selectedProduct.metadata?.[field.name] || ''}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, metadata: { ...selectedProduct.metadata, [field.name]: e.target.value } })}
                      style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '600', outline: 'none', appearance: 'none' }}
                    >
                      <option value="">{language === 'en' ? 'Select...' : 'Selectionnez...'}</option>
                      {field.options?.map((opt, idx) => <option key={opt} value={opt}>{getFieldOptionLabel(field, opt, idx)}</option>)}
                    </select>
                  ) : field.type === 'boolean' ? (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!selectedProduct.metadata?.[field.name]} onChange={(e) => setSelectedProduct({ ...selectedProduct, metadata: { ...selectedProduct.metadata, [field.name]: e.target.checked } })} style={{ width: '18px', height: '18px' }} />
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{getFieldLabel(field)}</span>
                    </label>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={getFieldPlaceholder(field)}
                      required={field.required}
                      value={selectedProduct.metadata?.[field.name] || ''}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, metadata: { ...selectedProduct.metadata, [field.name]: e.target.value } })}
                      style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '600', outline: 'none' }}
                    />
                  )}
                </div>
              </div>
            ))}

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
              <button type="button" onClick={() => setShowEditModal(false)} className="btn-hover" style={{ padding: '12px 24px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', borderRadius: 'var(--radius-sm)' }}>{t('cancelBtn')}</button>
              <button type="submit" className="btn-hover" style={{ padding: '12px 32px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={20} /> Sauvegarder
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Historique Stock */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Historique des Mouvements"
        subtitle={`Suivi des stocks pour : ${selectedProduct?.nom}`}
        maxWidth="700px"
        icon={Activity}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {productHistory.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Aucun mouvement enregistré.</div>
          ) : (
            <>
              {productHistory.slice((historyPage - 1) * historyItemsPerPage, historyPage * historyItemsPerPage).map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: m.type === 'ENTREE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: m.type === 'ENTREE' ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {m.type === 'ENTREE' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{m.type} - {m.quantite} pcs</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{m.raison} • {new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>STOCK</div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{m.nouveauStock}</div>
                  </div>
                </div>
              ))}

              {productHistory.length > historyItemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setHistoryPage(historyPage - 1)}
                    disabled={historyPage === 1}
                    style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: historyPage === 1 ? 'not-allowed' : 'pointer', opacity: historyPage === 1 ? 0.5 : 1, fontWeight: 600, fontSize: '0.8rem' }}
                  >
                    Précédent
                  </button>
                  <span style={{ alignSelf: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Page {historyPage} / {Math.ceil(productHistory.length / historyItemsPerPage)}</span>
                  <button
                    onClick={() => setHistoryPage(historyPage + 1)}
                    disabled={historyPage === Math.ceil(productHistory.length / historyItemsPerPage)}
                    style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: historyPage === Math.ceil(productHistory.length / historyItemsPerPage) ? 'not-allowed' : 'pointer', opacity: historyPage === Math.ceil(productHistory.length / historyItemsPerPage) ? 0.5 : 1, fontWeight: 600, fontSize: '0.8rem' }}
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      <style>{`
        .hover-row:hover { background-color: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); borderRadius: 10px; }
      `}</style>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </motion.div>
  );
};

export default Products;
