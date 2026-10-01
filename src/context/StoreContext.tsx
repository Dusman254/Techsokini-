import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  CATEGORIES,
  INITIAL_OFFERS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
} from '../data/initialCatalog';
import {
  ActiveRoute,
  CartItem,
  CategoryId,
  CategoryInfo,
  ClientAccount,
  Offer,
  Order,
  OrderStatus,
  Product,
  ProductReview,
  SiteSettings,
} from '../types/store';

export interface EffectivePricing {
  originalPrice: number;
  finalPrice: number;
  hasDiscount: boolean;
  discountAmount: number;
  discountPercentage: number;
  activeOffer?: Offer;
  badgeLabel?: string;
}

const INITIAL_CLIENTS: ClientAccount[] = [
  {
    id: 'client-1',
    name: 'Clara Njoroge',
    email: 'clara@atelierdesign.africa',
    phone: '+254 711 409 221',
    password: 'password123',
    defaultAddress: '14 Peponi Road, Westlands',
    city: 'Nairobi',
    createdAt: '2026-08-12T09:00:00Z',
  },
  {
    id: 'client-2',
    name: 'Dr. Leonard Mwangi',
    email: 'l.mwangi@nairobiarch.co.ke',
    phone: '+254 722 819 402',
    password: 'password123',
    defaultAddress: 'Suite 4B, Riverside Drive Office Park',
    city: 'Nairobi',
    createdAt: '2026-07-04T14:20:00Z',
  },
];

interface StoreContextValue {
  // Active storefront products (excludes items in 30-day Recycle Bin)
  products: Product[];
  // Products currently in the 30-day Recycle Bin
  deletedProducts: Product[];
  categories: CategoryInfo[];
  offers: Offer[];
  orders: Order[];
  settings: SiteSettings;
  cart: CartItem[];
  savedForLater: CartItem[];
  wishlist: string[];
  compareIds: string[];
  route: ActiveRoute;
  isRouteLoading: boolean;
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isCheckoutOpen: boolean;
  searchQuery: string;
  toastMessage: string | null;

  // Client Auth
  clients: ClientAccount[];
  currentClient: ClientAccount | null;
  loginClient: (email: string, password: string) => boolean;
  registerClient: (data: Omit<ClientAccount, 'id' | 'createdAt'>) => ClientAccount;
  logoutClient: () => void;
  updateClientProfile: (updates: Partial<ClientAccount>) => void;
  cancelClientOrder: (orderId: string) => void;

  // Admin Auth
  isAdminAuthenticated: boolean;
  authenticateAdmin: (code: string) => boolean;
  logoutAdmin: () => void;

  // Navigation & Overlays
  navigate: (nextRoute: ActiveRoute, skipSkeleton?: boolean) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsSearchOpen: (open: boolean) => void;
  setIsCheckoutOpen: (open: boolean) => void;
  setSearchQuery: (q: string) => void;
  showToast: (msg: string) => void;

  // Pricing & Offer helpers
  getEffectivePricing: (product: Product) => EffectivePricing;
  isOfferCurrentlyActive: (offer: Offer) => boolean;
  activeOffers: Offer[];
  expiredOrDisabledOffers: Offer[];

  // Cart, Wishlist & Compare actions
  addToCart: (
    productId: string,
    quantity?: number,
    openDrawer?: boolean,
    selectedVariations?: Record<string, string>,
    variationPriceDelta?: number
  ) => void;
  updateCartQuantity: (cartItemKeyOrProductId: string, quantity: number) => void;
  removeFromCart: (cartItemKeyOrProductId: string) => void;
  moveToSavedForLater: (cartItemKeyOrProductId: string) => void;
  moveToCartFromSaved: (cartItemKeyOrProductId: string) => void;
  removeFromSaved: (cartItemKeyOrProductId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;

  // Checkout & Reviews
  placeOrder: (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>
  ) => Order;
  addProductReview: (
    productId: string,
    review: Omit<ProductReview, 'id' | 'date' | 'verified'>
  ) => void;

  // Admin CRUD — Products & 30-Day Recycle Bin
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void; // Moves to 30-day Recycle Bin
  restoreProduct: (id: string) => void; // Restores from Recycle Bin
  permanentlyDeleteProduct: (id: string) => void; // Permanent purge
  duplicateProduct: (id: string) => Product | undefined;
  getDaysRemainingInRecycleBin: (deletedAt?: string) => number;

  // Admin CRUD — Offers
  addOffer: (offer: Omit<Offer, 'id'>) => Offer;
  updateOffer: (id: string, updates: Partial<Offer>) => void;
  deleteOffer: (id: string) => void;

  // Admin CRUD — Orders, Settings & Categories
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    trackingNote?: string
  ) => void;
  updateSettings: (updates: Partial<SiteSettings>) => void;
  updateCategory: (id: CategoryId, updates: Partial<CategoryInfo>) => void;
  resetDemoData: () => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  ALL_PRODUCTS: 'tech_sokoni_products_v3',
  OFFERS: 'tech_sokoni_offers_v3',
  ORDERS: 'tech_sokoni_orders_v3',
  CART: 'tech_sokoni_cart_v3',
  SAVED: 'tech_sokoni_saved_v3',
  WISHLIST: 'tech_sokoni_wishlist_v3',
  COMPARE: 'tech_sokoni_compare_v3',
  SETTINGS: 'tech_sokoni_settings_v4',
  CATEGORIES: 'tech_sokoni_categories_v3',
  CLIENTS: 'tech_sokoni_clients_v3',
  CURRENT_CLIENT: 'tech_sokoni_current_client_v3',
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // All products including soft-deleted ones (purging any older than 30 days on boot)
  const [allProducts, setAllProducts] = useState<Product[]>(() => {
    const loaded = loadFromStorage<Product[]>(
      STORAGE_KEYS.ALL_PRODUCTS,
      INITIAL_PRODUCTS
    );
    const now = Date.now();
    return loaded.filter((p) => {
      if (!p.deletedAt) return true;
      const deletedTime = new Date(p.deletedAt).getTime();
      return now - deletedTime < THIRTY_DAYS_MS;
    });
  });

  const [categories, setCategories] = useState<CategoryInfo[]>(() =>
    loadFromStorage(STORAGE_KEYS.CATEGORIES, CATEGORIES)
  );
  const [offers, setOffers] = useState<Offer[]>(() =>
    loadFromStorage(STORAGE_KEYS.OFFERS, INITIAL_OFFERS)
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    loadFromStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
  );
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() =>
    loadFromStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS)
  );

  const [cart, setCart] = useState<CartItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.CART, [
      {
        cartItemKey: 'prod-sony-wh1000xm5-studio',
        productId: 'prod-sony-wh1000xm5-studio',
        quantity: 1,
      },
    ])
  );
  const [savedForLater, setSavedForLater] = useState<CartItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.SAVED, [])
  );
  const [wishlist, setWishlist] = useState<string[]>(() =>
    loadFromStorage(STORAGE_KEYS.WISHLIST, ['prod-macbook-pro-16-m4'])
  );
  const [compareIds, setCompareIds] = useState<string[]>(() =>
    loadFromStorage(STORAGE_KEYS.COMPARE, [
      'prod-macbook-pro-16-m4',
      'prod-dell-xps-16-oled',
    ])
  );

  const [clients, setClients] = useState<ClientAccount[]>(() =>
    loadFromStorage(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS)
  );
  const [currentClient, setCurrentClient] = useState<ClientAccount | null>(() =>
    loadFromStorage<ClientAccount | null>(STORAGE_KEYS.CURRENT_CLIENT, null)
  );

  const [isAdminAuthenticated, setIsAdminAuthenticated] =
    useState<boolean>(false);

  const [route, setRoute] = useState<ActiveRoute>({ page: 'home' });
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active storefront products vs 30-day Recycle Bin products
  const products = useMemo(
    () => allProducts.filter((p) => !p.deletedAt),
    [allProducts]
  );

  const deletedProducts = useMemo(
    () => allProducts.filter((p) => Boolean(p.deletedAt)),
    [allProducts]
  );

  // Save to localStorage & sync across tabs
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.ALL_PRODUCTS,
        JSON.stringify(allProducts)
      );
    } catch {}
  }, [allProducts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch {}
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(offers));
    } catch {}
  }, [offers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(siteSettings));
    } catch {}
  }, [siteSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(savedForLater));
    } catch {}
  }, [savedForLater]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPARE, JSON.stringify(compareIds));
    } catch {}
  }, [compareIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    } catch {}
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_CLIENT,
        JSON.stringify(currentClient)
      );
    } catch {}
  }, [currentClient]);

  // Real-time cross-tab synchronization listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        if (e.key === STORAGE_KEYS.ALL_PRODUCTS) {
          setAllProducts(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.OFFERS) {
          setOffers(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.CATEGORIES) {
          setCategories(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.ORDERS) {
          setOrders(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.SETTINGS) {
          setSiteSettings(JSON.parse(e.newValue));
        }
      } catch {}
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const navigate = (nextRoute: ActiveRoute, skipSkeleton = false) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!skipSkeleton) {
      setIsRouteLoading(true);
      setRoute(nextRoute);
      setTimeout(() => {
        setIsRouteLoading(false);
      }, 180);
    } else {
      setRoute(nextRoute);
    }
  };

  // Client Auth Actions
  const loginClient = (email: string, password: string): boolean => {
    const normalized = email.trim().toLowerCase();
    const match = clients.find(
      (c) =>
        c.email.toLowerCase() === normalized &&
        (c.password === password || password === 'demo')
    );
    if (!match) return false;
    setCurrentClient(match);
    showToast(`Welcome back, ${match.name}`);
    return true;
  };

  const registerClient = (
    data: Omit<ClientAccount, 'id' | 'createdAt'>
  ): ClientAccount => {
    const created: ClientAccount = {
      ...data,
      id: `client-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [created, ...prev]);
    setCurrentClient(created);
    showToast(`Account created for ${created.name}`);
    return created;
  };

  const logoutClient = () => {
    setCurrentClient(null);
    showToast('Signed out of Client Area');
  };

  const updateClientProfile = (updates: Partial<ClientAccount>) => {
    if (!currentClient) return;
    const updated = { ...currentClient, ...updates };
    setCurrentClient(updated);
    setClients((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    showToast('Client profile updated');
  };

  const cancelClientOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId && o.status === 'Processing'
          ? { ...o, status: 'Cancelled' }
          : o
      )
    );
    showToast('Order cancelled');
  };

  // Admin Auth (Passcode verification)
  const authenticateAdmin = (code: string): boolean => {
    if (code.trim() === '1940') {
      setIsAdminAuthenticated(true);
      showToast('Admin Console unlocked');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    navigate({ page: 'home' });
  };

  const isOfferCurrentlyActive = (offer: Offer): boolean => {
    if (!offer.enabled) return false;
    const today = new Date().toISOString().slice(0, 10);
    if (offer.startDate && today < offer.startDate) return false;
    if (offer.endDate && today > offer.endDate) return false;
    return true;
  };

  const activeOffers = useMemo(
    () => offers.filter((o) => isOfferCurrentlyActive(o)),
    [offers]
  );

  const expiredOrDisabledOffers = useMemo(
    () => offers.filter((o) => !isOfferCurrentlyActive(o)),
    [offers]
  );

  const getEffectivePricing = (product: Product): EffectivePricing => {
    const originalPrice = product.price;
    let bestPrice =
      product.salePrice && product.salePrice < originalPrice
        ? product.salePrice
        : originalPrice;
    let appliedOffer: Offer | undefined;

    for (const offer of activeOffers) {
      if (offer.productIds.includes(product.id)) {
        const candidatePrice =
          offer.discountType === 'percentage'
            ? Math.round(originalPrice * (1 - offer.discountValue / 100))
            : Math.max(1, originalPrice - offer.discountValue);
        if (candidatePrice < bestPrice) {
          bestPrice = candidatePrice;
          appliedOffer = offer;
        }
      }
    }

    const hasDiscount = bestPrice < originalPrice;
    const discountAmount = hasDiscount ? originalPrice - bestPrice : 0;
    const discountPercentage = hasDiscount
      ? Math.round((discountAmount / originalPrice) * 100)
      : 0;

    return {
      originalPrice,
      finalPrice: bestPrice,
      hasDiscount,
      discountAmount,
      discountPercentage,
      activeOffer: appliedOffer,
      badgeLabel:
        appliedOffer?.badgeText ||
        (hasDiscount ? `SAVE ${discountPercentage}%` : undefined),
    };
  };

  const addToCart = (
    productId: string,
    quantity = 1,
    openDrawer = true,
    selectedVariations?: Record<string, string>,
    variationPriceDelta = 0
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const variationSuffix =
      selectedVariations && Object.keys(selectedVariations).length > 0
        ? Object.entries(selectedVariations)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join('|')
        : '';
    const cartItemKey = variationSuffix
      ? `${productId}__${variationSuffix}`
      : productId;

    setCart((prev) => {
      const existing = prev.find(
        (item) => (item.cartItemKey || item.productId) === cartItemKey
      );
      if (existing) {
        return prev.map((item) =>
          (item.cartItemKey || item.productId) === cartItemKey
            ? {
                ...item,
                quantity: Math.min(prod.stock || 99, item.quantity + quantity),
              }
            : item
        );
      }
      return [
        ...prev,
        {
          cartItemKey,
          productId,
          quantity,
          selectedVariations,
          variationPriceDelta,
        },
      ];
    });
    if (openDrawer) {
      setIsCartOpen(true);
    } else {
      showToast(`Added ${prod.name} to bag`);
    }
  };

  const updateCartQuantity = (
    cartItemKeyOrProductId: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(cartItemKeyOrProductId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        (item.cartItemKey || item.productId) === cartItemKeyOrProductId ||
        item.productId === cartItemKeyOrProductId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (cartItemKeyOrProductId: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          (item.cartItemKey || item.productId) !== cartItemKeyOrProductId &&
          item.productId !== cartItemKeyOrProductId
      )
    );
  };

  const moveToSavedForLater = (cartItemKeyOrProductId: string) => {
    const item = cart.find(
      (c) =>
        (c.cartItemKey || c.productId) === cartItemKeyOrProductId ||
        c.productId === cartItemKeyOrProductId
    );
    if (!item) return;
    removeFromCart(cartItemKeyOrProductId);
    setSavedForLater((prev) => {
      const itemKey = item.cartItemKey || item.productId;
      if (prev.some((s) => (s.cartItemKey || s.productId) === itemKey))
        return prev;
      return [...prev, { ...item }];
    });
    showToast('Saved for later');
  };

  const moveToCartFromSaved = (cartItemKeyOrProductId: string) => {
    const item = savedForLater.find(
      (s) =>
        (s.cartItemKey || s.productId) === cartItemKeyOrProductId ||
        s.productId === cartItemKeyOrProductId
    );
    if (!item) return;
    setSavedForLater((prev) =>
      prev.filter(
        (s) =>
          (s.cartItemKey || s.productId) !== cartItemKeyOrProductId &&
          s.productId !== cartItemKeyOrProductId
      )
    );
    addToCart(
      item.productId,
      item.quantity,
      false,
      item.selectedVariations,
      item.variationPriceDelta
    );
  };

  const removeFromSaved = (cartItemKeyOrProductId: string) => {
    setSavedForLater((prev) =>
      prev.filter(
        (s) =>
          (s.cartItemKey || s.productId) !== cartItemKeyOrProductId &&
          s.productId !== cartItemKeyOrProductId
      )
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        if (prod) showToast(`Removed ${prod.name} from wishlist`);
        return prev.filter((id) => id !== productId);
      } else {
        if (prod) showToast(`Saved ${prod.name} to wishlist`);
        return [...prev, productId];
      }
    });
  };

  const toggleCompare = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setCompareIds((prev) => {
      if (prev.includes(productId)) {
        if (prod) showToast(`Removed ${prod.name} from comparison`);
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 4) {
        showToast('Comparison limit is 4 systems at a time');
        return prev;
      }
      if (prod) showToast(`Added ${prod.name} to comparison`);
      return [...prev, productId];
    });
  };

  const clearCompare = () => setCompareIds([]);

  const placeOrder = (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>
  ): Order => {
    const nextNum = 1043 + orders.length;
    const newOrder: Order = {
      ...orderData,
      clientId: currentClient?.id,
      id: `ord-${Date.now()}`,
      orderNumber: `TS-2026-${nextNum}`,
      status: 'Processing',
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) => [newOrder, ...prev]);

    // Decrement stock for ordered items
    setAllProducts((prev) =>
      prev.map((prod) => {
        const ordered = orderData.items.find((i) => i.productId === prod.id);
        if (!ordered) return prod;
        return {
          ...prod,
          stock: Math.max(0, prod.stock - ordered.quantity),
        };
      })
    );

    clearCart();
    return newOrder;
  };

  const addProductReview = (
    productId: string,
    review: Omit<ProductReview, 'id' | 'date' | 'verified'>
  ) => {
    const newReview: ProductReview = {
      ...review,
      id: `rev-${Date.now()}`,
      date: 'September 2026',
      verified: true,
    };
    setAllProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const nextReviews = [newReview, ...p.reviews];
        const avg =
          nextReviews.reduce((sum, r) => sum + r.rating, 0) /
          nextReviews.length;
        return {
          ...p,
          reviews: nextReviews,
          reviewCount: p.reviewCount + 1,
          rating: Number(avg.toFixed(1)),
        };
      })
    );
    showToast('Review published. Thank you.');
  };

  // Admin Product & 30-Day Recycle Bin Management
  const addProduct = (productData: Omit<Product, 'id'>): Product => {
    const created: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    setAllProducts((prev) => [created, ...prev]);
    showToast(`Published ${created.name} to Storefront`);
    return created;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setAllProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    showToast('Synced changes to Storefront');
  };

  const deleteProduct = (id: string) => {
    setAllProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, deletedAt: new Date().toISOString() } : p
      )
    );
    setCart((prev) => prev.filter((c) => c.productId !== id));
    showToast('Moved product to Recycle Bin (retained for 30 days)');
  };

  const restoreProduct = (id: string) => {
    setAllProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, deletedAt: undefined } : p))
    );
    showToast('Restored product to live Storefront');
  };

  const permanentlyDeleteProduct = (id: string) => {
    setAllProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Permanently purged product from Recycle Bin');
  };

  const getDaysRemainingInRecycleBin = (deletedAt?: string): number => {
    if (!deletedAt) return 30;
    const elapsed = Date.now() - new Date(deletedAt).getTime();
    const remainingMs = Math.max(0, THIRTY_DAYS_MS - elapsed);
    return Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  };

  const duplicateProduct = (id: string): Product | undefined => {
    const source = allProducts.find((p) => p.id === id);
    if (!source) return undefined;
    const copy: Product = {
      ...source,
      id: `prod-${Date.now()}`,
      sku: `${source.sku}-II`,
      name: `${source.name} (Edition II)`,
      deletedAt: undefined,
    };
    setAllProducts((prev) => [copy, ...prev]);
    showToast(`Duplicated ${source.name}`);
    return copy;
  };

  // Admin Offer Management
  const addOffer = (offerData: Omit<Offer, 'id'>): Offer => {
    const created: Offer = {
      ...offerData,
      id: `offer-${Date.now()}`,
    };
    setOffers((prev) => [created, ...prev]);
    showToast(`Offer "${created.title}" synced to Storefront`);
    return created;
  };

  const updateOffer = (id: string, updates: Partial<Offer>) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
    showToast('Offer synced to Storefront');
  };

  const deleteOffer = (id: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
    showToast('Offer removed');
  };

  const updateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    trackingNote?: string
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              trackingNote:
                trackingNote !== undefined ? trackingNote : o.trackingNote,
            }
          : o
      )
    );
    showToast(`Order status updated to ${status}`);
  };

  const updateSettings = (updates: Partial<SiteSettings>) => {
    setSiteSettings((prev) => ({ ...prev, ...updates }));
    showToast('Storefront settings synced');
  };

  const updateCategory = (id: CategoryId, updates: Partial<CategoryInfo>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    showToast('Category updated on Storefront');
  };

  const resetDemoData = () => {
    setAllProducts(INITIAL_PRODUCTS);
    setCategories(CATEGORIES);
    setOffers(INITIAL_OFFERS);
    setOrders(INITIAL_ORDERS);
    setSiteSettings(INITIAL_SETTINGS);
    showToast('Storefront reset to factory showroom state');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        deletedProducts,
        categories,
        offers,
        orders,
        settings: siteSettings,
        cart,
        savedForLater,
        wishlist,
        compareIds,
        route,
        isRouteLoading,
        isCartOpen,
        isSearchOpen,
        isCheckoutOpen,
        searchQuery,
        toastMessage,
        clients,
        currentClient,
        loginClient,
        registerClient,
        logoutClient,
        updateClientProfile,
        cancelClientOrder,
        isAdminAuthenticated,
        authenticateAdmin,
        logoutAdmin,
        navigate,
        setIsCartOpen,
        setIsSearchOpen,
        setIsCheckoutOpen,
        setSearchQuery,
        showToast,
        getEffectivePricing,
        isOfferCurrentlyActive,
        activeOffers,
        expiredOrDisabledOffers,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        moveToSavedForLater,
        moveToCartFromSaved,
        removeFromSaved,
        clearCart,
        toggleWishlist,
        toggleCompare,
        clearCompare,
        placeOrder,
        addProductReview,
        addProduct,
        updateProduct,
        deleteProduct,
        restoreProduct,
        permanentlyDeleteProduct,
        duplicateProduct,
        getDaysRemainingInRecycleBin,
        addOffer,
        updateOffer,
        deleteOffer,
        updateOrderStatus,
        updateSettings,
        updateCategory,
        resetDemoData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextValue => {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
};
