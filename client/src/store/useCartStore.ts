import { create } from 'zustand';

interface CartItem {
  id: number;
  nom: string;
  prix: number;           // normalized price in global currency
  prixOriginal: number;   // original price as stored in DB
  deviseOriginal: string; // original currency of the product
  quantite: number;
  image?: string;
  prixAchat?: number;
  selectedVariantes?: { nom: string; valeur: string }[];
  cartId: string; // composite key: id + variant values string
}

interface CartState {
  cart: CartItem[];
  addToCart: (product: any, globalCurrency?: string, exchangeRate?: number, selectedVariantes?: { nom: string; valeur: string }[]) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, qte: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

// Convert a price between currencies using the admin exchange rate
const normalize = (price: number, fromDevise: string, toDevise: string, rate: number): number => {
  if (!fromDevise || fromDevise === toDevise) return price;
  if (fromDevise === 'USD' && toDevise === 'CDF') return Math.round(price * rate);
  if (fromDevise === 'CDF' && toDevise === 'USD') return Math.round((price / rate) * 100) / 100;
  if (fromDevise === 'EUR' && toDevise === 'CDF') return Math.round(price * rate);
  if (fromDevise === 'CDF' && toDevise === 'EUR') return Math.round((price / rate) * 100) / 100;
  // USD <-> EUR treated as 1:1
  return price;
};

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  addToCart: (product, globalCurrency = 'CDF', exchangeRate = 2250, selectedVariantes = []) => {
    const { cart } = get();
    const rawPrice = product.prixVente || product.prix || 0;
    const productDevise = product.devise || globalCurrency;
    const normalizedPrice = normalize(rawPrice, productDevise, globalCurrency, exchangeRate);

    // Create a unique cartId based on product id and selected variants
    const variantString = selectedVariantes.map(v => `${v.nom}:${v.valeur}`).join('|');
    const cartId = `${product.id}-${variantString}`;

    const existing = cart.find(item => item.cartId === cartId);
    if (existing) {
      set({
        cart: cart.map(item => item.cartId === cartId ? { ...item, quantite: item.quantite + 1 } : item)
      });
    } else {
      set({ cart: [...cart, {
        id: product.id,
        nom: product.nom,
        prix: normalizedPrice,
        prixOriginal: rawPrice,
        deviseOriginal: productDevise,
        quantite: 1,
        image: product.image,
        prixAchat: product.prixAchat || 0,
        selectedVariantes,
        cartId
      }] });
    }
  },
  removeFromCart: (cartId) => {
    set({ cart: get().cart.filter(item => item.cartId !== cartId) });
  },
  updateQuantity: (cartId, qte) => {
    set({ cart: get().cart.map(item => item.cartId === cartId ? { ...item, quantite: qte } : item) });
  },
  clearCart: () => set({ cart: [] }),
  getTotal: () => {
    return get().cart.reduce((acc, item) => {
      return acc + (item.prix * item.quantite);
    }, 0);
  }
}));
