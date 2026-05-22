export interface BusinessFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'color';
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

export interface BusinessTypeInfo {
  label: string;
  icon: string;
  color: string;
  description: string;
  fields: BusinessFieldConfig[];
  requiresVariants?: boolean;
}

export const BUSINESS_TYPES: Record<string, BusinessTypeInfo> = {
  'commerce-general': {
    label: 'Commerce Général',
    icon: 'Store',
    color: '#6366f1',
    description: 'Gestion standard des ventes, stocks et clients.',
    fields: []
  },
  'pharmacie': {
    label: 'Pharmacie & Santé',
    icon: 'Heart',
    color: '#ef4444',
    description: 'Suivi des dates d\'expiration, numéros de lot et ordonnances.',
    fields: [
      { name: 'dateExpiration', label: 'Date d\'Expiration', type: 'date', required: true },
      { name: 'numeroLot', label: 'Numéro de Lot', type: 'text', placeholder: 'Ex: LOT-2026-A', required: true },
      { name: 'fabricant', label: 'Fabricant / Laboratoire', type: 'text', placeholder: 'Ex: Pfizer, Sanofi' },
      { name: 'prescriptionRequise', label: 'Sur ordonnance uniquement', type: 'boolean' },
      { name: 'posologie', label: 'Indications / Posologie', type: 'text', placeholder: 'Ex: 1 comp. matin et soir' },
      { name: 'temperatureStockage', label: 'Température de Stockage', type: 'select', options: ['Ambiante (< 25°C)', 'Réfrigéré (2-8°C)', 'Congelé (< -15°C)'] }
    ]
  },
  'quincaillerie': {
    label: 'Quincaillerie & BTP',
    icon: 'Wrench',
    color: '#f59e0b',
    description: 'Unités de mesure spéciales, poids, dimensions et marques.',
    fields: [
      { name: 'dimensions', label: 'Dimensions (L x l x H)', type: 'text', placeholder: 'Ex: 120 x 80 x 10 cm' },
      { name: 'poids', label: 'Poids (kg)', type: 'number', placeholder: 'Ex: 12.5' },
      { name: 'marque', label: 'Marque', type: 'text', placeholder: 'Ex: Stanley, Bosch' },
      { name: 'uniteMesure', label: 'Unité de Mesure', type: 'select', options: ['Pièce', 'Mètre', 'Mètre Carré', 'Mètre Cube', 'Kilogramme', 'Litre', 'Sac'] },
      { name: 'compatibilite', label: 'Compatibilité / Modèle', type: 'text', placeholder: 'Ex: Universel, tuyaux 32mm' }
    ]
  },
  'boutique-mode': {
    label: 'Boutique de Mode',
    icon: 'Shirt',
    color: '#ec4899',
    description: 'Gestion des variantes de tailles, couleurs, genres et matières.',
    fields: [
      { name: 'taille', label: 'Tailles disponibles', type: 'select', options: ['Unique', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', '43'] },
      { name: 'couleur', label: 'Couleur', type: 'color' },
      { name: 'genre', label: 'Genre', type: 'select', options: ['Mixte', 'Homme', 'Femme', 'Enfant'] },
      { name: 'matiere', label: 'Matière / Textile', type: 'text', placeholder: 'Ex: 100% Coton, Cuir' }
    ],
    requiresVariants: true
  }
};
