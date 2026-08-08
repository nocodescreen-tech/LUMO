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
import { exportToExcel } from '../utils/exportUtils';
import * as XLSX from 'xlsx';
import { BUSINESS_TYPES } from '../constants/businessTypes';
import { useTranslation } from '../hooks/useTranslation';

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
  const [searchTerm, setSearchTerm] = useState('');

  const user = useAuthStore(state => state.user);
  const currency = useAuthStore(state => state.currency) || 'CDF';
  const exchangeRate = useAuthStore(state => state.exchangeRate) || 2250;
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
    if (fromDevise === toDevise || !exchangeRate || exchangeRate === 0) return price;
    // CDF -> USD
    if (fromDevise === 'CDF' && toDevise === 'USD') return Math.round((price / exchangeRate) * 100) / 100;
    // USD -> CDF
    if (fromDevise === 'USD' && toDevise === 'CDF') return Math.round(price * exchangeRate);
    return price;
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
    exportToExcel(dataToExport, language === 'en' ? 'Products_Report' : 'Produits_Report');
  };

  const handleDownloadTemplate = () => {
    const activityType = normalizeActivityType(user?.typeActivite);
    const businessFields = BUSINESS_TYPES[activityType]?.fields || [];

    const isEn = language === 'en';
    const templateRow: any = {
      [isEn ? 'Name' : 'Nom']: isEn ? 'Example Product (Required)' : 'Exemple Produit (Obligatoire)',
      [isEn ? 'Category' : 'Categorie']: isEn ? 'Electronics (Optional)' : 'Électronique (Optionnel)',
      [isEn ? 'SalePrice' : 'PrixVente']: 1500,
      [isEn ? 'PurchasePrice' : 'PrixAchat']: 1000,
      [isEn ? 'Stock' : 'Stock']: 50,
      [isEn ? 'Currency' : 'Devise']: 'USD'
    };

    businessFields.forEach((field) => {
      let example = getFieldPlaceholder(field) || '...';
      if (field.type === 'boolean') example = language === 'en' ? 'Yes / No' : 'Oui / Non';
      if (field.type === 'date') example = 'YYYY-MM-DD';
      if (field.options) example = field.options.map((opt, idx) => getFieldOptionLabel(field, opt, idx)).join(' / ');
      templateRow[getFieldLabel(field)] = example;
    });

    const templateData = [templateRow];
    exportToExcel(templateData, isEn ? 'Product_Import_Template' : 'Modele_Import_Produits');
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

        const hasRequiredColumns = parsedData.some((row: any) => {
          const name = row.Nom || row.nom || row.Name || row.name;
          const price = row.PrixVente || row.prixVente || row.prix || row.SalePrice || row.price;
          const stock = row.Stock || row.stock;
          return name && price !== undefined && stock !== undefined;
        });

        if (!hasRequiredColumns) {
          throw new Error('Missing required columns');
        }

        const activityType = normalizeActivityType(user?.typeActivite);
        const businessFields = BUSINESS_TYPES[activityType]?.fields || [];

        const validProducts = parsedData
          .map(row => {
          const price = Number(row.PrixVente || row.prixVente || row.prix || row.SalePrice || row.price);
          const purchasePrice = Number(row.PrixAchat || row.prixAchat || row.PurchasePrice || row.cost || 0);
          const stock = Number(row.Stock || row.stock);
          const devise = normalizeCurrency(row.Devise || row.devise || row.Currency || currency);
          const nom = String(row.Nom || row.nom || row.Name || row.name || '').trim();

          const metadata: Record<string, any> = typeof row.Metadata === 'string'
            ? (() => { try { return JSON.parse(row.Metadata); } catch { return {}; } })()
            : (row.Metadata && typeof row.Metadata === 'object' ? row.Metadata : {});

          businessFields.forEach((field: any) => {
            const label = getFieldLabel(field);
            const val = row[label] ?? row[field.name];
            if (val !== undefined && val !== null && String(val).trim() !== '') {
              metadata[field.name] = field.type === 'boolean'
                ? ['oui', 'yes', 'true', '1'].includes(String(val).toLowerCase())
                : val;
            }
          });

          return {
            nom: nom || (language === 'en' ? 'Unknown Product' : 'Produit Inconnu'),
            categorie: String(row.Categorie || row.categorie || row.Category || row.category || 'General').trim(),
            prix: Number.isFinite(price) ? price : 0,
            prixAchat: Number.isFinite(purchasePrice) ? purchasePrice : 0,
            stock: Number.isFinite(stock) ? stock : 0,
            devise,
            codeBarre: String(row.CodeBarre || row.codeBarre || row.Barcode || row.barcode || '').trim() || null,
            description: String(row.Description || row.description || '').trim() || '',
            metadata
          };
        })
          .filter(p => p.nom && p.prix > 0 && p.stock >= 0);

        if (!validProducts.length) {
          throw new Error('No valid rows');
        }

        const res = await api.post('/products/bulk', { products: validProducts });
        const importedCount = res.data.success ? res.data.data.length : res.data.length;
        const serverMsg = res.data?.message || '';
        toast.success(serverMsg || t('productsImportedCount').replace('{count}', String(importedCount)));
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
    } catch (error) {
      console.error(error);
      toast.error(t('productsLoadFailed'));
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
    const filtered = allProducts.filter((p: any) =>
      p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categorie.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setProducts(filtered);
    setCurrentPage(1); // Reset to page 1 on search
  }, [searchTerm, allProducts]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = products.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(products.length / itemsPerPage);

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
    Object.entries(newProduct).forEach(([key, value]) => {
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
    Object.entries(selectedProduct).forEach(([key, value]) => {
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
  const lowStockCount = allProducts.filter((p: any) => p.stock < (p.stockAlerte || 5)).length;
  const outOfStockCount = allProducts.filter((p: any) => p.stock <= 0).length;
  const uniqueCategories = Array.from(new Set(allProducts.map((p: any) => p.categorie).filter(Boolean)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}
    >
      <div className="responsive-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '900', fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase' }}>
            <Boxes size={14} /> {t('globalInventory')}
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', margin: 0 }}>
            {t('productsStock').split(' & ')[0]} & <span className="text-gradient">{t('productsStock').split(' & ')[1] || 'Stock'}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{t('inventoryDesc')}</p>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div className="glass stats-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', minWidth: 'clamp(140px, 20vw, 180px)', flex: '1 1 140px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Layers size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>{t('items')}</span>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{totalProducts}</div>
            </div>
          </div>

          <div className="glass stats-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', minWidth: 'clamp(160px, 22vw, 220px)', flex: '1 1 160px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>{t('stockValueSale')}</span>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--success)' }}>
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
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--warning)' }}>
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
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--danger)' }}>{lowStockCount}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass" style={{ padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '16px', alignItems: 'center', border: '1px solid var(--border)', background: 'var(--bg-card)', flexWrap: 'wrap' }}>
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
          {(canDo('products.import') || canDo('products.add')) && (
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
          {products.length > 0 && canDo('products.delete') && (
            <button onClick={handleAllDelete} className="glass btn-hover" style={{ padding: '0 24px', height: '48px', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: '600' }}>
              <Trash2 size={18} /> {t('deleteAll')}
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

      {/* Table Section */}
      <div className="glass" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
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
                          p.nom[0].toUpperCase()
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
                        backgroundColor: p.stock < (p.stockAlerte || 5) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        border: `1px solid ${p.stock < (p.stockAlerte || 5) ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                      }}>
                        <span style={{ fontWeight: '700', fontSize: '1rem', color: p.stock < (p.stockAlerte || 5) ? 'var(--danger)' : 'var(--success)' }}>{p.stock}</span>
                        <span style={{ fontSize: '0.75rem', marginLeft: '6px', fontWeight: '600', opacity: 0.7 }}>{t('units') || 'unités'}</span>
                      </div>
                      {p.stock < (p.stockAlerte || 5) && <AlertTriangle size={18} color="var(--danger)" className="animate-pulse" />}
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
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', padding: '0 12px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
            Affichage de <span style={{ color: 'var(--text-main)' }}>{indexOfFirstItem + 1}</span> à <span style={{ color: 'var(--text-main)' }}>{Math.min(indexOfLastItem, products.length)}</span> sur <span style={{ color: 'var(--text-main)' }}>{products.length}</span> produits
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
                    setConversionBanner(`💱 Prix convertis : ${oldDevise} → ${newDevise} (taux: 1 USD = ${exchangeRate.toLocaleString()} CDF)`);
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
              <input type="number" required readOnly={calc.active} value={isNaN(newProduct.prixVente) ? '' : newProduct.prixVente} onChange={(e) => setNewProduct({ ...newProduct, prixVente: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: calc.active ? 'rgba(0,0,0,0.05)' : 'var(--bg-main)', color: 'var(--success)', fontSize: '1.1rem', fontWeight: '800', outline: 'none' }} />
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Variantes (Taille, Couleur, etc.)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {newProduct.variantes.map((v, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px' }}>
                  <input placeholder="ex: Couleur" value={v.nom} onChange={e => {
                    const newV = [...newProduct.variantes];
                    newV[i].nom = e.target.value;
                    setNewProduct({ ...newProduct, variantes: newV });
                  }} style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' }} />
                  <input placeholder="ex: Rouge" value={v.valeur} onChange={e => {
                    const newV = [...newProduct.variantes];
                    newV[i].valeur = e.target.value;
                    setNewProduct({ ...newProduct, variantes: newV });
                  }} style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' }} />
                  <button type="button" onClick={() => setNewProduct({ ...newProduct, variantes: newProduct.variantes.filter((_, idx) => idx !== i) })} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={18} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setNewProduct({ ...newProduct, variantes: [...newProduct.variantes, { nom: '', valeur: '' }] })} style={{ alignSelf: 'flex-start', padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--primary)', color: 'var(--primary)', fontWeight: '700', background: 'none', cursor: 'pointer' }}>+ Ajouter une variante</button>
            </div>
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
                      setConversionBanner(`💱 Prix convertis : ${oldDevise} → ${newDevise} (taux: 1 USD = ${exchangeRate.toLocaleString()} CDF)`);
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
                <input type="number" required readOnly={calc.active} value={isNaN(selectedProduct.prix) ? '' : (selectedProduct.prix || '')} onChange={(e) => setSelectedProduct({ ...selectedProduct, prix: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: calc.active ? 'rgba(0,0,0,0.05)' : 'var(--bg-main)', color: 'var(--success)', fontSize: '1.1rem', fontWeight: '800', outline: 'none' }} />
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Variantes</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(selectedProduct.variantes || []).map((v: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '10px' }}>
                    <input placeholder="ex: Taille" value={v.nom} onChange={e => {
                      const newV = [...selectedProduct.variantes];
                      newV[i].nom = e.target.value;
                      setSelectedProduct({ ...selectedProduct, variantes: newV });
                    }} style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' }} />
                    <input placeholder="ex: XL" value={v.valeur} onChange={e => {
                      const newV = [...selectedProduct.variantes];
                      newV[i].valeur = e.target.value;
                      setSelectedProduct({ ...selectedProduct, variantes: newV });
                    }} style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' }} />
                    <button type="button" onClick={() => setSelectedProduct({ ...selectedProduct, variantes: selectedProduct.variantes.filter((_: any, idx: number) => idx !== i) })} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={18} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setSelectedProduct({ ...selectedProduct, variantes: [...(selectedProduct.variantes || []), { nom: '', valeur: '' }] })} style={{ alignSelf: 'flex-start', padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--primary)', color: 'var(--primary)', fontWeight: '700', background: 'none', cursor: 'pointer' }}>+ Ajouter une variante</button>
              </div>
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
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{m.nouveauStock}</div>
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
