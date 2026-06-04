export interface BusinessFieldConfig {
  name: string;
  label: string;
  labelEn?: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'color';
  placeholder?: string;
  placeholderEn?: string;
  options?: string[];
  optionsEn?: string[];
  required?: boolean;
}

export interface BusinessTypeInfo {
  label: string;
  labelEn?: string;
  icon: string;
  color: string;
  description: string;
  descriptionEn?: string;
  fields: BusinessFieldConfig[];
  requiresVariants?: boolean;
}

export const BUSINESS_TYPES: Record<string, BusinessTypeInfo> = {
  'commerce-general': {
    label: 'Commerce general',
    labelEn: 'General commerce',
    icon: 'Store',
    color: '#6366f1',
    description: 'Gestion standard des ventes, stocks et clients.',
    descriptionEn: 'Standard management of sales, stock and customers.',
    fields: []
  },
  pharmacie: {
    label: 'Pharmacie & sante',
    labelEn: 'Pharmacy & health',
    icon: 'Heart',
    color: '#ef4444',
    description: "Suivi des dates d'expiration, numeros de lot et ordonnances.",
    descriptionEn: 'Track expiration dates, batch numbers and prescriptions.',
    fields: [
      { name: 'dateExpiration', label: "Date d'expiration", labelEn: 'Expiration date', type: 'date', required: true },
      { name: 'numeroLot', label: 'Numero de lot', labelEn: 'Batch number', type: 'text', placeholder: 'Ex: LOT-2026-A', placeholderEn: 'Ex: LOT-2026-A', required: true },
      { name: 'fabricant', label: 'Fabricant / Laboratoire', labelEn: 'Manufacturer / Laboratory', type: 'text', placeholder: 'Ex: Pfizer, Sanofi', placeholderEn: 'Ex: Pfizer, Sanofi' },
      { name: 'prescriptionRequise', label: 'Sur ordonnance uniquement', labelEn: 'Prescription only', type: 'boolean' },
      { name: 'posologie', label: 'Indications / Posologie', labelEn: 'Directions / Dosage', type: 'text', placeholder: 'Ex: 1 comp. matin et soir', placeholderEn: 'Ex: 1 tablet morning and evening' },
      {
        name: 'temperatureStockage',
        label: 'Temperature de stockage',
        labelEn: 'Storage temperature',
        type: 'select',
        options: ['Ambiante (< 25 C)', 'Refrigere (2-8 C)', 'Congele (< -15 C)'],
        optionsEn: ['Room temperature (< 25 C)', 'Refrigerated (2-8 C)', 'Frozen (< -15 C)']
      }
    ]
  },
  quincaillerie: {
    label: 'Quincaillerie & BTP',
    labelEn: 'Hardware & construction',
    icon: 'Wrench',
    color: '#f59e0b',
    description: 'Unites de mesure speciales, poids, dimensions et marques.',
    descriptionEn: 'Special measurement units, weights, dimensions and brands.',
    fields: [
      { name: 'dimensions', label: 'Dimensions (L x l x H)', labelEn: 'Dimensions (L x W x H)', type: 'text', placeholder: 'Ex: 120 x 80 x 10 cm', placeholderEn: 'Ex: 120 x 80 x 10 cm' },
      { name: 'poids', label: 'Poids (kg)', labelEn: 'Weight (kg)', type: 'number', placeholder: 'Ex: 12.5', placeholderEn: 'Ex: 12.5' },
      { name: 'marque', label: 'Marque', labelEn: 'Brand', type: 'text', placeholder: 'Ex: Stanley, Bosch', placeholderEn: 'Ex: Stanley, Bosch' },
      {
        name: 'uniteMesure',
        label: 'Unite de mesure',
        labelEn: 'Measurement unit',
        type: 'select',
        options: ['Piece', 'Metre', 'Metre carre', 'Metre cube', 'Kilogramme', 'Litre', 'Sac'],
        optionsEn: ['Piece', 'Meter', 'Square meter', 'Cubic meter', 'Kilogram', 'Liter', 'Bag']
      },
      { name: 'compatibilite', label: 'Compatibilite / Modele', labelEn: 'Compatibility / Model', type: 'text', placeholder: 'Ex: Universel, tuyaux 32mm', placeholderEn: 'Ex: Universal, 32mm pipes' }
    ]
  },
  'boutique-mode': {
    label: 'Boutique de mode',
    labelEn: 'Fashion store',
    icon: 'Shirt',
    color: '#ec4899',
    description: 'Gestion des variantes de tailles, couleurs, genres et matieres.',
    descriptionEn: 'Manage size, color, gender and material variants.',
    fields: [
      { name: 'taille', label: 'Tailles disponibles', labelEn: 'Available sizes', type: 'select', options: ['Unique', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', '43'], optionsEn: ['One size', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', '43'] },
      { name: 'couleur', label: 'Couleur', labelEn: 'Color', type: 'color' },
      { name: 'genre', label: 'Genre', labelEn: 'Gender', type: 'select', options: ['Mixte', 'Homme', 'Femme', 'Enfant'], optionsEn: ['Unisex', 'Men', 'Women', 'Children'] },
      { name: 'matiere', label: 'Matiere / Textile', labelEn: 'Material / Textile', type: 'text', placeholder: 'Ex: 100% Coton, Cuir', placeholderEn: 'Ex: 100% cotton, leather' }
    ],
    requiresVariants: true
  }
};

