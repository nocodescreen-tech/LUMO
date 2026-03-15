import { create } from 'zustand';

interface CartItem {
  id: number;
  nom: string;
  prix: number;
  quantite: number;
  image?: string;
}

interface CartState {
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, qte: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  addToCart: (product) => {
    const { cart } = get();
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      set({ 
        cart: cart.map(item => item.id === product.id ? { ...item, quantite: item.quantite + 1 } : item) 
      });
    } else {
      set({ cart: [...cart, { 
        id: product.id, 
        nom: product.nom, 
        prix: product.prixVente || product.prix || 0, 
        quantite: 1,
        image: product.image 
      }] });
    }
  },
  removeFromCart: (productId) => {
    set({ cart: get().cart.filter(item => item.id !== productId) });
  },
  updateQuantity: (productId, qte) => {
    set({ cart: get().cart.map(item => item.id === productId ? { ...item, quantite: qte } : item) });
  },
  clearCart: () => set({ cart: [] }),
  getTotal: () => {
    return get().cart.reduce((acc, item) => {
        const p = (item as any).prixVente || (item as any).prix || 0;
        const q = (item as any).quantite || (item as any).quantity || 1;
        return acc + (p * q);
    }, 0);
  }
}));
