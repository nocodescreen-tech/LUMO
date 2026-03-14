import { create } from 'zustand';

interface CartItem {
  id: number;
  nom: string;
  prix: number;
  quantite: number;
}

interface CartState {
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, qte: number) => void;
  clearCart: () => void;
  total: number;
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
      set({ cart: [...cart, { id: product.id, nom: product.nom, prix: product.prix, quantite: 1 }] });
    }
  },
  removeFromCart: (productId) => {
    set({ cart: get().cart.filter(item => item.id !== productId) });
  },
  updateQuantity: (productId, qte) => {
    set({ cart: get().cart.map(item => item.id === productId ? { ...item, quantite: qte } : item) });
  },
  clearCart: () => set({ cart: [] }),
  get total() {
    return get().cart.reduce((acc, item) => acc + (item.prix * item.quantite), 0);
  }
}));
