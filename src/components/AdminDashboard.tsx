import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Edit3,
  ImagePlus,
  Loader2,
  Lock,
  LogOut,
  Package,
  Plus,
  RotateCcw,
  Settings,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { STUDIO_IMAGES } from '../data/initialCatalog';
import {
  CategoryId,
  Offer,
  OrderStatus,
  Product,
  ProductCondition,
  ProductVariationGroup,
} from '../types/store';
import { AiProductService } from '../services/aiProductService';
import { parseAndEnforceExactUserSpecs } from '../utils/exactProductParser';
import { downloadOrderReceiptPdf } from '../services/pdfReceiptService';
import { StudioImage } from './StudioImage';

type AdminTab =
  | 'products'
  | 'recycle-bin'
  | 'offers'
  | 'inventory'
  | 'orders'
  | 'categories'
  | 'settings';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    deletedProducts,
    categories,
    offers,
    activeOffers,
    expiredOrDisabledOffers,
    orders,
    settings,
    isAdminAuthenticated,
    authenticateAdmin,
    logoutAdmin,
    navigate,
    getEffectivePricing,
    isOfferCurrentlyActive,
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
    showToast,
  } = useStore();

  // Hidden Admin Passcode Gate State
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [offerFilter, setOfferFilter] = useState<'all' | 'active' | 'expired'>(
    'all'
  );

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  // Optional Variations Toggle — OFF by default so variations are never automatic
  const [variationsEnabled, setVariationsEnabled] = useState(false);

  const [prodForm, setProdForm] = useState<{
    name: string;
    sku: string;
    brand: string;
    category: CategoryId;
    price: number;
    salePrice: string;
    stock: number;
    condition: ProductCondition;
    shortSpec: string;
    shortDescription: string;
    description: string;
    images: string[];
    processor: string;
    ram: string;
    storage: string;
    screenSize: string;
    color: string;
    os: string;
    graphics: string;
    ports: string;
    battery: string;
    weight: string;
    warranty: string;
    variations: ProductVariationGroup[];
    featured: boolean;
    isNewArrival: boolean;
    inShowroomRail: boolean;
  }>({
    name: '',
    sku: 'TS-NEW-001',
    brand: 'Apple',
    category: 'laptops',
    price: 1999,
    salePrice: '',
    stock: 10,
    condition: 'New',
    shortSpec: 'M4 Pro · 32GB RAM · 1TB NVMe SSD · 16.0" · Space Black',
    shortDescription:
      'Precision hardware engineered for professional studio workflows.',
    description:
      'Full studio hardware configuration with verified warranty and express delivery.',
    images: [STUDIO_IMAGES.laptopPro],
    processor: 'Apple M4 Pro',
    ram: '32GB',
    storage: '1TB SSD',
    screenSize: '16.0"',
    color: 'Space Black',
    os: 'macOS Sequoia',
    graphics: '20-Core GPU',
    ports: '3x Thunderbolt 5, HDMI, MagSafe 3',
    battery: 'Up to 22 hours',
    weight: '2.1 kg',
    warranty: '2 Years Tech Sokoni Official Warranty',
    variations: [],
    featured: true,
    isNewArrival: true,
    inShowroomRail: true,
  });

  // Offer Modal State
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState<{
    title: string;
    subtitle: string;
    badgeText: string;
    bannerText: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    productIds: string[];
    startDate: string;
    endDate: string;
    enabled: boolean;
    featured: boolean;
  }>({
    title: '',
    subtitle: '',
    badgeText: 'LIMITED PRIVILEGE',
    bannerText: '',
    discountType: 'percentage',
    discountValue: 15,
    productIds: [],
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    enabled: true,
    featured: true,
  });

  // Handle Admin Passcode Gate Submission
  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = authenticateAdmin(passcodeInput);
    if (!ok) {
      setPasscodeError(true);
      setPasscodeInput('');
    } else {
      setPasscodeError(false);
      setPasscodeInput('');
    }
  };

  // Trigger AI Product Auto-Generation via AiProductService with Strict Field Matching
  const triggerAiProductAutoFill = async (inputSeed?: string) => {
    const query = (inputSeed ?? (aiPromptInput || prodForm.name)).trim();
    if (!query) {
      showToast('Enter a product title or specification first to auto-generate');
      return;
    }

    setIsAiGenerating(true);
    try {
      const generated = await AiProductService.generateFromTitle({
        productTitle: query,
        categoryHint: prodForm.category,
        includeVariations: variationsEnabled,
      });

      const enforced = parseAndEnforceExactUserSpecs(query);

      setProdForm((prev) => ({
        ...prev,
        name: generated.name,
        sku: generated.sku,
        brand: generated.brand,
        category: generated.category,
        condition: generated.condition,
        price: generated.price,
        shortSpec: generated.shortSpec,
        shortDescription: generated.shortDescription,
        description: enforced.description,
        processor: generated.specs.processor,
        ram: generated.specs.ram,
        storage: generated.specs.storage,
        screenSize: generated.specs.screenSize,
        color: generated.specs.color,
        os: generated.specs.os,
        graphics: generated.specs.graphics,
        ports: generated.specs.ports,
        battery: generated.specs.battery,
        weight: generated.specs.weight,
        warranty: generated.specs.warranty,
        // Never overwrite or auto-enable variations unless variationsEnabled is ON
        variations: variationsEnabled
          ? prev.variations.length > 0
            ? prev.variations
            : generated.variations
          : [],
        images:
          prev.images.length === 0 ? [enforced.defaultImg] : prev.images,
      }));
      showToast(
        'AI auto-generated Product Name, SKU, Summary, Key Config & Technical Specs with strict field matching'
      );
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Variation Builder Helpers inside Add/Edit Product Modal
  const addVariationGroup = (presetName?: string) => {
    const groupName = presetName || 'Custom Option';
    const defaultOptions =
      groupName === 'Storage'
        ? [
            { id: `o-${Date.now()}-1`, label: prodForm.storage || '512GB SSD', priceDelta: 0, inStock: true },
            { id: `o-${Date.now()}-2`, label: '1TB NVMe SSD', priceDelta: 150, inStock: true },
            { id: `o-${Date.now()}-3`, label: '2TB NVMe SSD', priceDelta: 350, inStock: true },
          ]
        : groupName === 'RAM'
        ? [
            { id: `o-${Date.now()}-1`, label: prodForm.ram || '16GB', priceDelta: 0, inStock: true },
            { id: `o-${Date.now()}-2`, label: '32GB', priceDelta: 150, inStock: true },
            { id: `o-${Date.now()}-3`, label: '64GB', priceDelta: 350, inStock: true },
          ]
        : groupName === 'Color'
        ? [
            { id: `o-${Date.now()}-1`, label: prodForm.color || 'Space Black', priceDelta: 0, inStock: true },
            { id: `o-${Date.now()}-2`, label: 'Natural Silver', priceDelta: 0, inStock: true },
            { id: `o-${Date.now()}-3`, label: 'Titanium Gray', priceDelta: 0, inStock: true },
          ]
        : groupName === 'Screen Size'
        ? [
            { id: `o-${Date.now()}-1`, label: prodForm.screenSize || '14.0"', priceDelta: 0, inStock: true },
            { id: `o-${Date.now()}-2`, label: '16.0"', priceDelta: 200, inStock: true },
          ]
        : [
            { id: `o-${Date.now()}-1`, label: 'Standard', priceDelta: 0, inStock: true },
          ];

    setProdForm((prev) => ({
      ...prev,
      variations: [
        ...prev.variations,
        {
          id: `vg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: groupName,
          options: defaultOptions,
        },
      ],
    }));
  };

  const removeVariationGroup = (groupId: string) => {
    setProdForm((prev) => ({
      ...prev,
      variations: prev.variations.filter((g) => g.id !== groupId),
    }));
  };

  const updateVariationGroupName = (groupId: string, name: string) => {
    setProdForm((prev) => ({
      ...prev,
      variations: prev.variations.map((g) =>
        g.id === groupId ? { ...g, name } : g
      ),
    }));
  };

  const addOptionToVariationGroup = (groupId: string) => {
    setProdForm((prev) => ({
      ...prev,
      variations: prev.variations.map((g) =>
        g.id === groupId
          ? {
              ...g,
              options: [
                ...g.options,
                {
                  id: `opt-${Date.now()}-${g.options.length}`,
                  label: 'New Option',
                  priceDelta: 0,
                  inStock: true,
                },
              ],
            }
          : g
      ),
    }));
  };

  const updateVariationOption = (
    groupId: string,
    optionId: string,
    updates: { label?: string; priceDelta?: number; inStock?: boolean }
  ) => {
    setProdForm((prev) => ({
      ...prev,
      variations: prev.variations.map((g) =>
        g.id === groupId
          ? {
              ...g,
              options: g.options.map((o) =>
                o.id === optionId ? { ...o, ...updates } : o
              ),
            }
          : g
      ),
    }));
  };

  const removeVariationOption = (groupId: string, optionId: string) => {
    setProdForm((prev) => ({
      ...prev,
      variations: prev.variations.map((g) =>
        g.id === groupId
          ? {
              ...g,
              options: g.options.filter((o) => o.id !== optionId),
            }
          : g
      ),
    }));
  };

  // Handle Simultaneous Multi-Image Upload (Up to 5 images at the same time)
  const handleMultipleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).slice(0, 5);
    const readFileAsDataUrl = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    try {
      const uploadedDataUrls = await Promise.all(files.map(readFileAsDataUrl));
      setProdForm((prev) => {
        const combined = [...uploadedDataUrls, ...prev.images].slice(0, 5);
        return { ...prev, images: combined };
      });
      showToast(
        `Uploaded ${uploadedDataUrls.length} image${
          uploadedDataUrls.length > 1 ? 's' : ''
        } (max 5)`
      );
    } catch {
      showToast('Could not read one or more image files');
    }
    e.target.value = '';
  };

  const openCreateProduct = () => {
    setEditingProductId(null);
    setAiPromptInput('');
    setVariationsEnabled(false);
    setProdForm({
      name: '',
      sku: `TS-SYS-${100 + products.length + 1}`,
      brand: 'Apple',
      category: 'laptops',
      price: 1899,
      salePrice: '',
      stock: 12,
      condition: 'New',
      shortSpec: '',
      shortDescription: '',
      description: '',
      images: [STUDIO_IMAGES.laptopPro],
      processor: '',
      ram: '',
      storage: '',
      screenSize: '',
      color: 'Space Black',
      os: '',
      graphics: '',
      ports: '',
      battery: '',
      weight: '',
      warranty: '1 Year Tech Sokoni Official Warranty',
      variations: [],
      featured: true,
      isNewArrival: true,
      inShowroomRail: true,
    });
    setIsProductModalOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setAiPromptInput(product.name);
    const hasExistingVariations = Boolean(
      product.variations && product.variations.length > 0
    );
    setVariationsEnabled(hasExistingVariations);
    setProdForm({
      name: product.name,
      sku: product.sku,
      brand: product.brand,
      category: product.category,
      price: product.price,
      salePrice: product.salePrice ? String(product.salePrice) : '',
      stock: product.stock,
      condition: product.condition,
      shortSpec: product.shortSpec,
      shortDescription: product.shortDescription,
      description: product.description,
      images: product.images.slice(0, 5),
      processor: product.specs.processor || '',
      ram: product.specs.ram || '',
      storage: product.specs.storage || '',
      screenSize: product.specs.screenSize || '',
      color: product.specs.color || 'Space Black',
      os: product.specs.os || '',
      graphics: product.specs.graphics || '',
      ports: product.specs.ports || '',
      battery: product.specs.battery || '',
      weight: product.specs.weight || '',
      warranty: product.specs.warranty || '1 Year Official Warranty',
      variations: product.variations || [],
      featured: product.featured,
      isNewArrival: product.isNewArrival,
      inShowroomRail: product.inShowroomRail,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanImages = prodForm.images.filter(Boolean).slice(0, 5);

    const payload = {
      name: prodForm.name.trim() || 'Untitled Hardware System',
      sku: prodForm.sku.trim(),
      brand: prodForm.brand.trim() || 'Tech Sokoni',
      category: prodForm.category,
      price: Number(prodForm.price) || 999,
      salePrice: prodForm.salePrice ? Number(prodForm.salePrice) : undefined,
      stock: Number(prodForm.stock) || 0,
      condition: prodForm.condition,
      shortSpec: prodForm.shortSpec.trim(),
      shortDescription: prodForm.shortDescription.trim(),
      description: prodForm.description.trim(),
      images:
        cleanImages.length > 0 ? cleanImages : [STUDIO_IMAGES.laptopPro],
      specs: {
        processor: prodForm.processor || undefined,
        ram: prodForm.ram || undefined,
        storage: prodForm.storage || undefined,
        screenSize: prodForm.screenSize || undefined,
        color: prodForm.color || undefined,
        os: prodForm.os || undefined,
        graphics: prodForm.graphics || undefined,
        ports: prodForm.ports || undefined,
        battery: prodForm.battery || undefined,
        weight: prodForm.weight || undefined,
        warranty: prodForm.warranty || '1 Year Tech Sokoni Official Warranty',
      },
      variations: variationsEnabled ? prodForm.variations : [],
      featured: prodForm.featured,
      isNewArrival: prodForm.isNewArrival,
      inShowroomRail: prodForm.inShowroomRail,
      rating: 5.0,
      reviewCount: 1,
      reviews: [],
      deliveryInfo:
        'In stock at Tech Sokoni Showroom. Same-day courier dispatch.',
    };

    if (editingProductId) {
      updateProduct(editingProductId, payload);
    } else {
      addProduct(payload);
    }
    setIsProductModalOpen(false);
  };

  const openCreateOffer = () => {
    setEditingOfferId(null);
    setOfferForm({
      title: 'Executive Hardware Allocation Offer',
      subtitle: 'Special pricing on selected studio workstations and displays.',
      badgeText: 'STUDIO PRIVILEGE',
      bannerText:
        'EXECUTIVE ALLOCATION — PRIVILEGE PRICING ON SELECTED SYSTEMS',
      discountType: 'percentage',
      discountValue: 12,
      productIds: products.slice(0, 2).map((p) => p.id),
      startDate: '2026-09-01',
      endDate: '2026-12-31',
      enabled: true,
      featured: true,
    });
    setIsOfferModalOpen(true);
  };

  const openEditOffer = (offer: Offer) => {
    setEditingOfferId(offer.id);
    setOfferForm({
      title: offer.title,
      subtitle: offer.subtitle,
      badgeText: offer.badgeText,
      bannerText: offer.bannerText,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      productIds: offer.productIds,
      startDate: offer.startDate,
      endDate: offer.endDate,
      enabled: offer.enabled,
      featured: offer.featured,
    });
    setIsOfferModalOpen(true);
  };

  const handleSaveOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOfferId) {
      updateOffer(editingOfferId, offerForm);
    } else {
      addOffer(offerForm);
    }
    setIsOfferModalOpen(false);
  };

  const toggleProductInOfferForm = (prodId: string) => {
    setOfferForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(prodId)
        ? prev.productIds.filter((id) => id !== prodId)
        : [...prev.productIds, prodId],
    }));
  };

  // =========================================================================
  // SECURITY GATE: Hidden Passcode Authentication (No hint shown anywhere)
  // =========================================================================
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[82vh] showroom-canvas flex items-center justify-center px-4 py-12">
        <div className="bg-[#F4F3EF] border border-[#141413]/20 max-w-sm w-full p-8 shadow-2xl text-center space-y-5">
          <div className="w-12 h-12 bg-[#141413] text-[#F4F3EF] mx-auto flex items-center justify-center">
            <Lock className="w-5 h-5 stroke-[1.5]" />
          </div>

          <div>
            <p className="text-[10px] font-mono-num uppercase tracking-[0.24em] text-[#6E6D68]">
              TECH SOKONI · RESTRICTED ACCESS
            </p>
            <h1 className="font-editorial text-3xl text-[#141413] mt-1">
              Executive Authorization
            </h1>
            <p className="text-xs text-[#6E6D68] mt-1">
              Enter authorization key to unlock the Management Console.
            </p>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <input
              type="password"
              required
              autoFocus
              value={passcodeInput}
              onChange={(e) => {
                setPasscodeInput(e.target.value);
                setPasscodeError(false);
              }}
              placeholder="Authorization Code"
              className="w-full bg-[#EAE9E4] border border-[#141413]/25 px-4 py-3 text-center font-mono-num text-sm tracking-[0.3em] text-[#141413] focus:outline-none focus:border-[#141413]"
            />

            {passcodeError && (
              <p className="text-xs font-mono-num text-[#D94E34]">
                Access denied. Invalid authorization code.
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] transition-colors cursor-pointer"
            >
              Authenticate
            </button>
          </form>

          <button
            onClick={() => navigate({ page: 'home' })}
            className="text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68] hover:text-[#141413] cursor-pointer"
          >
            ← Return to Showroom
          </button>
        </div>
      </div>
    );
  }

  const displayedOffers =
    offerFilter === 'active'
      ? activeOffers
      : offerFilter === 'expired'
      ? expiredOrDisabledOffers
      : offers;

  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-[#F4F3EF] pb-24">
      {/* Top Admin Header */}
      <div className="bg-[#141413] text-[#F4F3EF] py-8 px-4 sm:px-8 border-b border-[#141413]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-mono-num uppercase tracking-[0.24em] text-[#A09F99]">
              TECH SOKONI · LIVE STOREFRONT MANAGEMENT CONSOLE
            </p>
            <h1 className="font-editorial text-3xl sm:text-4xl text-[#F4F3EF] mt-1">
              Storefront, AI Catalog & Offer Administration
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={resetDemoData}
              className="px-3.5 py-2 border border-[#F4F3EF]/25 text-xs font-mono-num uppercase tracking-wider text-[#F4F3EF] hover:border-[#F4F3EF] flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>
            <button
              onClick={() => navigate({ page: 'home' })}
              className="px-3.5 py-2 bg-[#F4F3EF] text-[#141413] text-xs font-mono-num uppercase tracking-wider hover:bg-[#EAE9E4] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Live Storefront</span>
            </button>
            <button
              onClick={logoutAdmin}
              className="px-3.5 py-2 border border-[#D94E34] text-[#D94E34] text-xs font-mono-num uppercase tracking-wider hover:bg-[#D94E34] hover:text-[#F4F3EF] flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Strip */}
      <div className="border-b border-[#141413]/10 bg-[#EAE9E4]/60">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-5 grid grid-cols-2 lg:grid-cols-4 gap-6 font-mono-num">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#6E6D68]">
              Active Storefront Systems
            </p>
            <p className="text-2xl font-semibold text-[#141413] mt-1">
              {products.length}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#6E6D68]">
              30-Day Recycle Bin
            </p>
            <p className="text-2xl font-semibold text-[#D94E34] mt-1">
              {deletedProducts.length}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#6E6D68]">
              Active Deals & Offers
            </p>
            <p className="text-2xl font-semibold text-[#1F6F43] mt-1">
              {activeOffers.length}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#6E6D68]">
              Recorded Dispatch Volume
            </p>
            <p className="text-2xl font-semibold text-[#141413] mt-1">
              {settings.currencySymbol}
              {totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-[#141413]/12 pb-4">
          {(
            [
              {
                id: 'products',
                label: `Products (${products.length})`,
                icon: Package,
              },
              {
                id: 'recycle-bin',
                label: `Recycle Bin (${deletedProducts.length})`,
                icon: Trash2,
              },
              {
                id: 'offers',
                label: `Offers & Deals (${offers.length})`,
                icon: Tag,
              },
              { id: 'inventory', label: 'Inventory & Stock', icon: Check },
              {
                id: 'orders',
                label: `Orders & Progress (${orders.length})`,
                icon: ShoppingBag,
              },
              { id: 'categories', label: 'Categories', icon: Copy },
              {
                id: 'settings',
                label: 'Storefront Settings',
                icon: Settings,
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-xs font-mono-num uppercase tracking-[0.15em] flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[#141413] text-[#F4F3EF]'
                    : 'bg-[#EAE9E4]/60 text-[#5E5D59] hover:text-[#141413]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ===================================================================
            TAB 1: PRODUCTS MANAGEMENT
           =================================================================== */}
        {activeTab === 'products' && (
          <div className="py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-editorial text-3xl text-[#141413]">
                  Hardware Catalog Management
                </h2>
                <p className="text-xs text-[#6E6D68]">
                  Add products with AI auto-spec generation and 5-image upload.
                  Deleted items stay in the Recycle Bin for 30 days.
                </p>
              </div>
              <button
                onClick={openCreateProduct}
                className="px-5 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-widest flex items-center gap-2 cursor-pointer self-start"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product (AI Assisted)</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-[#141413]/12 bg-[#F4F3EF]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#141413]/12 bg-[#EAE9E4]/70 text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                    <th className="py-3.5 px-4">System</th>
                    <th className="py-3.5 px-4">SKU · Dept</th>
                    <th className="py-3.5 px-4">Base / Effective Price</th>
                    <th className="py-3.5 px-4">Stock</th>
                    <th className="py-3.5 px-4">Storefront Placement</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141413]/10 text-xs">
                  {products.map((prod) => {
                    const pricing = getEffectivePricing(prod);
                    return (
                      <tr key={prod.id} className="hover:bg-[#EAE9E4]/40">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#EAE9E4] p-1.5 shrink-0 flex items-center justify-center">
                              <StudioImage
                                src={prod.images[0]}
                                alt={prod.name}
                                containerClassName="w-full h-full"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-[#141413]">
                                {prod.name}
                              </p>
                              <p className="text-[11px] text-[#6E6D68]">
                                {prod.brand} · {prod.images.length} image(s)
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono-num text-[#5E5D59]">
                          <div>{prod.sku}</div>
                          <div className="uppercase text-[10px] text-[#6E6D68]">
                            {prod.category}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono-num">
                          <div className="font-semibold text-[#141413]">
                            {settings.currencySymbol}
                            {pricing.finalPrice.toLocaleString()}
                          </div>
                          {pricing.hasDiscount && (
                            <div className="text-[11px] text-[#D94E34]">
                              Base {settings.currencySymbol}
                              {pricing.originalPrice.toLocaleString()} (−
                              {pricing.discountPercentage}%)
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono-num">
                          <span
                            className={
                              prod.stock > 5
                                ? 'text-[#1F6F43]'
                                : 'text-[#D94E34] font-semibold'
                            }
                          >
                            {prod.stock} units
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-2 font-mono-num text-[10px]">
                            <button
                              onClick={() =>
                                updateProduct(prod.id, {
                                  featured: !prod.featured,
                                })
                              }
                              className={`px-2 py-1 border cursor-pointer ${
                                prod.featured
                                  ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                                  : 'border-[#141413]/20 text-[#6E6D68]'
                              }`}
                            >
                              {prod.featured ? '★ Featured' : '☆ Not Featured'}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => openEditProduct(prod)}
                              title="Edit Product"
                              className="p-1.5 border border-[#141413]/20 hover:border-[#141413] text-[#141413] cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => duplicateProduct(prod.id)}
                              title="Duplicate Product"
                              className="p-1.5 border border-[#141413]/20 hover:border-[#141413] text-[#141413] cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteProduct(prod.id)}
                              title="Move to 30-Day Recycle Bin"
                              className="p-1.5 border border-[#141413]/20 hover:border-[#D94E34] text-[#D94E34] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: 30-DAY RECYCLE BIN
           =================================================================== */}
        {activeTab === 'recycle-bin' && (
          <div className="py-8 space-y-6">
            <div>
              <h2 className="font-editorial text-3xl text-[#141413]">
                30-Day Product Recycle Bin
              </h2>
              <p className="text-xs text-[#6E6D68]">
                Deleted products remain safely archived here for 30 days before
                automatic purge. Restore any item to publish it back to the
                live storefront immediately.
              </p>
            </div>

            {deletedProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deletedProducts.map((item) => {
                  const daysRemaining = getDaysRemainingInRecycleBin(
                    item.deletedAt
                  );
                  return (
                    <div
                      key={item.id}
                      className="bg-[#EAE9E4]/65 border border-[#141413]/15 p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-16 h-16 bg-[#F4F3EF] p-2 shrink-0 flex items-center justify-center">
                          <StudioImage
                            src={item.images[0]}
                            alt={item.name}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-contain opacity-70"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono-num uppercase text-[#D94E34] font-semibold">
                            {daysRemaining} days left in Recycle Bin
                          </span>
                          <h3 className="text-sm font-semibold text-[#141413] truncate">
                            {item.name}
                          </h3>
                          <p className="text-xs font-mono-num text-[#6E6D68]">
                            {item.sku} · {settings.currencySymbol}
                            {item.price.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => restoreProduct(item.id)}
                          className="px-3.5 py-2 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => permanentlyDeleteProduct(item.id)}
                          title="Delete permanently"
                          className="p-2 border border-[#D94E34]/40 text-[#D94E34] hover:bg-[#D94E34] hover:text-[#F4F3EF] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center border border-[#141413]/10 bg-[#EAE9E4]/35">
                <p className="font-editorial text-2xl text-[#141413]">
                  Recycle Bin is empty.
                </p>
                <p className="text-xs text-[#6E6D68] mt-1">
                  Any product deleted from the catalog will be retained here for
                  30 days.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            TAB 3: OFFERS & DEALS MANAGEMENT
           =================================================================== */}
        {activeTab === 'offers' && (
          <div className="py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-editorial text-3xl text-[#141413]">
                  Tech Sokoni Offer & Deal Management
                </h2>
                <p className="text-xs text-[#6E6D68]">
                  Create percentage or fixed-amount privileges, set start/end
                  dates, manage promotional banners, and assign products.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex border border-[#141413]/20 text-xs font-mono-num">
                  {(
                    [
                      { id: 'all', label: `All (${offers.length})` },
                      {
                        id: 'active',
                        label: `Active (${activeOffers.length})`,
                      },
                      {
                        id: 'expired',
                        label: `Expired (${expiredOrDisabledOffers.length})`,
                      },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setOfferFilter(f.id)}
                      className={`px-3 py-1.5 cursor-pointer ${
                        offerFilter === f.id
                          ? 'bg-[#141413] text-[#F4F3EF]'
                          : 'text-[#6E6D68]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={openCreateOffer}
                  className="px-5 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-widest flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Offer</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayedOffers.map((offer) => {
                const isLive = isOfferCurrentlyActive(offer);
                return (
                  <div
                    key={offer.id}
                    className="bg-[#EAE9E4]/65 border border-[#141413]/15 p-6 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono-num mb-2">
                        <span
                          className={
                            isLive
                              ? 'text-[#1F6F43] font-semibold'
                              : 'text-[#6E6D68]'
                          }
                        >
                          {isLive
                            ? '● ACTIVE ON STOREFRONT'
                            : '○ INACTIVE / EXPIRED'}
                        </span>
                        <span className="text-[#6E6D68]">
                          {offer.startDate} → {offer.endDate}
                        </span>
                      </div>

                      <h3 className="font-editorial text-2xl text-[#141413]">
                        {offer.title}
                      </h3>
                      <p className="text-xs text-[#5E5D59] mt-1">
                        {offer.subtitle}
                      </p>

                      <div className="mt-4 p-3 bg-[#F4F3EF] border border-[#141413]/10 text-xs font-mono-num space-y-1">
                        <div>
                          <span className="text-[#6E6D68]">Discount: </span>
                          <strong className="text-[#D94E34]">
                            {offer.discountType === 'percentage'
                              ? `${offer.discountValue}% OFF`
                              : `${settings.currencySymbol}${offer.discountValue} Fixed Discount`}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#6E6D68]">
                            Assigned Products ({offer.productIds.length}):{' '}
                          </span>
                          <span>
                            {offer.productIds
                              .map(
                                (id) =>
                                  products.find((p) => p.id === id)?.name || id
                              )
                              .join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#141413]/10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateOffer(offer.id, { enabled: !offer.enabled })
                          }
                          className={`px-3 py-1.5 text-[11px] font-mono-num uppercase tracking-wider border cursor-pointer ${
                            offer.enabled
                              ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                              : 'border-[#141413]/25 text-[#141413]'
                          }`}
                        >
                          {offer.enabled ? 'Disable Offer' : 'Enable Offer'}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditOffer(offer)}
                          className="p-2 border border-[#141413]/20 hover:border-[#141413] text-[#141413] cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteOffer(offer.id)}
                          className="p-2 border border-[#141413]/20 hover:border-[#D94E34] text-[#D94E34] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 4: INVENTORY & STOCK CONTROL
           =================================================================== */}
        {activeTab === 'inventory' && (
          <div className="py-8 space-y-6">
            <h2 className="font-editorial text-3xl text-[#141413]">
              Real-Time Warehouse Stock Control
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="p-4 bg-[#EAE9E4]/50 border border-[#141413]/10 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono-num text-[#6E6D68]">
                      {p.sku}
                    </p>
                    <p className="text-xs font-semibold text-[#141413] truncate">
                      {p.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 font-mono-num shrink-0">
                    <button
                      onClick={() =>
                        updateProduct(p.id, {
                          stock: Math.max(0, p.stock - 1),
                        })
                      }
                      className="w-7 h-7 border border-[#141413]/25 flex items-center justify-center text-xs cursor-pointer"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-xs font-semibold">
                      {p.stock}
                    </span>
                    <button
                      onClick={() =>
                        updateProduct(p.id, { stock: p.stock + 1 })
                      }
                      className="w-7 h-7 border border-[#141413]/25 flex items-center justify-center text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 5: ORDERS & LIVE CLIENT PROGRESS CONTROL
           =================================================================== */}
        {activeTab === 'orders' && (
          <div className="py-8 space-y-6">
            <h2 className="font-editorial text-3xl text-[#141413]">
              Client Orders, Progress Control & Receipts
            </h2>
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#EAE9E4]/60 border border-[#141413]/12 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono-num">
                      <span className="font-semibold text-[#141413]">
                        {order.orderNumber}
                      </span>
                      <span>·</span>
                      <span>{order.customerName}</span>
                      <span>·</span>
                      <span className="text-[#6E6D68]">
                        {order.customerPhone}
                      </span>
                    </div>
                    <p className="text-xs text-[#5E5D59]">
                      Deliver to: {order.shippingAddress}, {order.city} ·{' '}
                      {order.paymentMethod}
                    </p>
                    <p className="text-xs font-mono-num text-[#141413] pt-1">
                      Items:{' '}
                      {order.items
                        .map((i) => `${i.quantity}x ${i.productName}`)
                        .join(', ')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right font-mono-num mr-2">
                      <p className="text-sm font-semibold text-[#141413]">
                        {settings.currencySymbol}
                        {order.total.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-[#6E6D68]">
                        {order.createdAt.slice(0, 10)}
                      </p>
                    </div>

                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateOrderStatus(
                          order.id,
                          e.target.value as OrderStatus
                        )
                      }
                      className="bg-[#F4F3EF] border border-[#141413]/25 px-3 py-2 text-xs font-mono-num text-[#141413]"
                    >
                      <option value="Processing">1. Order Confirmed</option>
                      <option value="Packed & Verified">
                        2. Serial Verified & Packed
                      </option>
                      <option value="Dispatched">
                        3. Dispatched / In Transit
                      </option>
                      <option value="Delivered">4. Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    <button
                      onClick={() => downloadOrderReceiptPdf(order, settings)}
                      title="Download Client PDF Receipt"
                      className="px-3 py-2 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 6: CATEGORIES MANAGEMENT
           =================================================================== */}
        {activeTab === 'categories' && (
          <div className="py-8 space-y-6">
            <h2 className="font-editorial text-3xl text-[#141413]">
              Showroom Department Taglines & Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-5 bg-[#EAE9E4]/60 border border-[#141413]/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-num text-xs font-semibold uppercase tracking-widest text-[#141413]">
                      {cat.shortLabel}
                    </span>
                    <span className="text-xs font-mono-num text-[#6E6D68]">
                      From {settings.currencySymbol}
                      {cat.startingPrice}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={cat.tagline}
                    onChange={(e) =>
                      updateCategory(cat.id, { tagline: e.target.value })
                    }
                    className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-3 py-1.5 text-xs text-[#141413]"
                  />
                  <input
                    type="text"
                    value={cat.editorialHeadline}
                    onChange={(e) =>
                      updateCategory(cat.id, {
                        editorialHeadline: e.target.value,
                      })
                    }
                    className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-3 py-1.5 text-xs text-[#141413]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 7: STOREFRONT SETTINGS
           =================================================================== */}
        {activeTab === 'settings' && (
          <div className="py-8 max-w-2xl space-y-5">
            <h2 className="font-editorial text-3xl text-[#141413]">
              Storefront & Contact Settings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1.5">
                  Concierge Phone
                </label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={(e) =>
                    updateSettings({ supportPhone: e.target.value })
                  }
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs text-[#141413]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1.5">
                  Concierge Email
                </label>
                <input
                  type="text"
                  value={settings.supportEmail}
                  onChange={(e) =>
                    updateSettings({ supportEmail: e.target.value })
                  }
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs text-[#141413]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1.5">
                Showroom Physical Address
              </label>
              <input
                type="text"
                value={settings.showroomAddress}
                onChange={(e) =>
                  updateSettings({ showroomAddress: e.target.value })
                }
                className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs text-[#141413]"
              />
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          PRODUCT ADD / EDIT MODAL WITH AI AUTO-GENERATOR & 5-IMAGE UPLOAD
         ===================================================================== */}
      {isProductModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#141413]/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <form
            onSubmit={handleSaveProduct}
            className="bg-[#F4F3EF] border border-[#141413]/20 max-w-3xl w-full p-6 sm:p-8 my-8 space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#141413]/10">
              <div>
                <p className="text-[10px] font-mono-num uppercase tracking-[0.2em] text-[#6E6D68]">
                  TECH SOKONI · AI-ASSISTED HARDWARE ARCHIVE
                </p>
                <h3 className="font-editorial text-2xl sm:text-3xl text-[#141413]">
                  {editingProductId
                    ? 'Edit Hardware System'
                    : 'Add New Hardware System'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-[#141413] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI AUTO-GENERATOR BAR (STRICT EXACT-INPUT FIDELITY) */}
            <div className="bg-[#141413] text-[#F4F3EF] p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono-num uppercase tracking-[0.18em] flex items-center gap-1.5 text-[#F4F3EF]">
                  <Sparkles className="w-3.5 h-3.5 text-[#D94E34]" />
                  <span>
                    Gemini AI Spec Engine — Exact Feature Fidelity Enabled
                  </span>
                </span>
                <span className="text-[10px] font-mono-num text-[#A09F99]">
                  Preserves 100% of your written RAM, Storage, CPU, Screen & Color
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={aiPromptInput}
                  onChange={(e) => setAiPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      triggerAiProductAutoFill(aiPromptInput);
                    }
                  }}
                  placeholder='e.g. HP EliteBook 840 G8 Core i5 16GB RAM 512GB SSD 14" Silver...'
                  className="flex-1 bg-[#252523] border border-[#F4F3EF]/20 px-3.5 py-2.5 text-xs text-[#F4F3EF] placeholder:text-[#8E8D87] focus:outline-none focus:border-[#F4F3EF]"
                />
                <button
                  type="button"
                  disabled={isAiGenerating}
                  onClick={() => triggerAiProductAutoFill(aiPromptInput)}
                  className="px-4 py-2.5 bg-[#D94E34] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  {isAiGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Auto-Fill Exact Specs</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Product Name & SKU */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68]">
                    Product Title / Specifications *
                  </label>
                  <button
                    type="button"
                    onClick={() => triggerAiProductAutoFill(prodForm.name)}
                    className="text-[10px] font-mono-num uppercase tracking-wider text-[#D94E34] hover:underline cursor-pointer"
                  >
                    ⚡ Auto-Fill From This Title
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProdForm({ ...prodForm, name: val });
                    setAiPromptInput(val);
                  }}
                  onBlur={() => {
                    if (
                      prodForm.name.trim().length > 3 &&
                      !prodForm.shortSpec.trim() &&
                      !isAiGenerating
                    ) {
                      triggerAiProductAutoFill(prodForm.name);
                    }
                  }}
                  placeholder="Type product title & features (e.g. Dell Latitude 7440 Core i7 16GB RAM 512GB SSD)"
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3 py-2 text-xs text-[#141413]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  required
                  value={prodForm.sku}
                  onChange={(e) =>
                    setProdForm({ ...prodForm, sku: e.target.value })
                  }
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3 py-2 text-xs font-mono-num text-[#141413]"
                />
              </div>
            </div>

            {/* Brand, Category, Price, Stock */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={prodForm.brand}
                  onChange={(e) =>
                    setProdForm({ ...prodForm, brand: e.target.value })
                  }
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3 py-2 text-xs text-[#141413]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                  Category
                </label>
                <select
                  value={prodForm.category}
                  onChange={(e) =>
                    setProdForm({
                      ...prodForm,
                      category: e.target.value as CategoryId,
                    })
                  }
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3 py-2 text-xs text-[#141413]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  required
                  value={prodForm.price}
                  onChange={(e) =>
                    setProdForm({
                      ...prodForm,
                      price: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3 py-2 text-xs font-mono-num text-[#141413]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                  Stock Units
                </label>
                <input
                  type="number"
                  required
                  value={prodForm.stock}
                  onChange={(e) =>
                    setProdForm({
                      ...prodForm,
                      stock: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3 py-2 text-xs font-mono-num text-[#141413]"
                />
              </div>
            </div>

            {/* Key Configuration & Short Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                  Key Configuration (`shortSpec`)
                </label>
                <input
                  type="text"
                  value={prodForm.shortSpec}
                  onChange={(e) =>
                    setProdForm({ ...prodForm, shortSpec: e.target.value })
                  }
                  placeholder="Core i5 · 16GB RAM · 512GB SSD · 14.0&quot; · Silver"
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3 py-2 text-xs font-mono-num text-[#141413]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                  Short Summary (`shortDescription`)
                </label>
                <input
                  type="text"
                  value={prodForm.shortDescription}
                  onChange={(e) =>
                    setProdForm({
                      ...prodForm,
                      shortDescription: e.target.value,
                    })
                  }
                  placeholder="Concise editorial summary..."
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3 py-2 text-xs text-[#141413]"
                />
              </div>
            </div>

            {/* Technical Specifications Matrix */}
            <div className="p-4 bg-[#EAE9E4]/50 border border-[#141413]/12 space-y-3">
              <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#141413] font-semibold">
                Technical Specifications (Exact Match With Input)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-mono-num uppercase text-[#6E6D68]">
                    Processor
                  </label>
                  <input
                    type="text"
                    value={prodForm.processor}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, processor: e.target.value })
                    }
                    className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-2.5 py-1.5 text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono-num uppercase text-[#6E6D68]">
                    Memory (RAM)
                  </label>
                  <input
                    type="text"
                    value={prodForm.ram}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, ram: e.target.value })
                    }
                    className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-2.5 py-1.5 text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono-num uppercase text-[#6E6D68]">
                    Storage
                  </label>
                  <input
                    type="text"
                    value={prodForm.storage}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, storage: e.target.value })
                    }
                    className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-2.5 py-1.5 text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono-num uppercase text-[#6E6D68]">
                    Display / Screen Size
                  </label>
                  <input
                    type="text"
                    value={prodForm.screenSize}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, screenSize: e.target.value })
                    }
                    className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-2.5 py-1.5 text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono-num uppercase text-[#6E6D68]">
                    Color / Finish
                  </label>
                  <input
                    type="text"
                    value={prodForm.color}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, color: e.target.value })
                    }
                    className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-2.5 py-1.5 text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono-num uppercase text-[#6E6D68]">
                    Operating System
                  </label>
                  <input
                    type="text"
                    value={prodForm.os}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, os: e.target.value })
                    }
                    className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-2.5 py-1.5 text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono-num uppercase text-[#6E6D68]">
                    Graphics / GPU
                  </label>
                  <input
                    type="text"
                    value={prodForm.graphics}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, graphics: e.target.value })
                    }
                    className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-2.5 py-1.5 text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono-num uppercase text-[#6E6D68]">
                    Ports & I/O
                  </label>
                  <input
                    type="text"
                    value={prodForm.ports}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, ports: e.target.value })
                    }
                    className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-2.5 py-1.5 text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono-num uppercase text-[#6E6D68]">
                    Weight
                  </label>
                  <input
                    type="text"
                    value={prodForm.weight}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, weight: e.target.value })
                    }
                    className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-2.5 py-1.5 text-xs text-[#141413]"
                  />
                </div>
              </div>
            </div>

            {/* ===============================================================
                PRODUCT VARIATIONS BUILDER (OPTIONAL — TURNED ON ONLY WHEN NEEDED)
               =============================================================== */}
            <div className="p-4 bg-[#EAE9E4]/50 border border-[#141413]/12 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#141413] font-semibold">
                      Product Variations (Optional — Storage, RAM, Color, Screen Size)
                    </p>
                    <span
                      className={`px-2 py-0.5 text-[9px] font-mono-num uppercase tracking-wider ${
                        variationsEnabled
                          ? 'bg-[#1F6F43] text-[#F4F3EF]'
                          : 'bg-[#141413]/10 text-[#6E6D68]'
                      }`}
                    >
                      {variationsEnabled ? 'Enabled' : 'Disabled (Default)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6E6D68] mt-0.5">
                    Variations are not added automatically. Turn this ON only when this product has multiple options.
                  </p>
                </div>

                {/* Explicit On/Off Toggle Button */}
                <button
                  type="button"
                  onClick={() => setVariationsEnabled((prev) => !prev)}
                  className={`px-4 py-2 text-[11px] font-mono-num uppercase tracking-wider border transition-colors cursor-pointer shrink-0 flex items-center gap-2 ${
                    variationsEnabled
                      ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                      : 'bg-[#F4F3EF] text-[#141413] border-[#141413]/25 hover:border-[#141413]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      variationsEnabled ? 'bg-[#36B37E]' : 'bg-[#8E8D87]'
                    }`}
                  />
                  <span>
                    {variationsEnabled
                      ? 'Turn Off Variations'
                      : 'Turn On Variations'}
                  </span>
                </button>
              </div>

              {variationsEnabled && (
                <div className="pt-3 border-t border-[#141413]/10 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                      Quick Add Variation Group:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        ['Storage', 'RAM', 'Color', 'Screen Size'] as const
                      ).map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => addVariationGroup(preset)}
                          className="px-2.5 py-1 bg-[#F4F3EF] border border-[#141413]/20 hover:border-[#141413] text-[10px] font-mono-num uppercase tracking-wider text-[#141413] cursor-pointer"
                        >
                          + {preset}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => addVariationGroup('Processor')}
                        className="px-2.5 py-1 bg-[#141413] text-[#F4F3EF] text-[10px] font-mono-num uppercase tracking-wider cursor-pointer"
                      >
                        + Custom Group
                      </button>
                    </div>
                  </div>

                  {prodForm.variations.length > 0 ? (
                    <div className="space-y-3">
                      {prodForm.variations.map((group) => (
                        <div
                          key={group.id}
                          className="bg-[#F4F3EF] border border-[#141413]/15 p-3 space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                              <span className="text-[10px] font-mono-num uppercase text-[#6E6D68]">
                                Variation Name:
                              </span>
                              <input
                                type="text"
                                value={group.name}
                                onChange={(e) =>
                                  updateVariationGroupName(
                                    group.id,
                                    e.target.value
                                  )
                                }
                                placeholder="e.g. Storage, RAM, Color, Screen Size"
                                className="bg-[#EAE9E4]/70 border border-[#141413]/20 px-2.5 py-1 text-xs font-semibold text-[#141413]"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  addOptionToVariationGroup(group.id)
                                }
                                className="px-2.5 py-1 border border-[#141413]/20 text-[10px] font-mono-num uppercase text-[#141413] hover:border-[#141413] cursor-pointer"
                              >
                                + Add Option
                              </button>
                              <button
                                type="button"
                                onClick={() => removeVariationGroup(group.id)}
                                className="text-xs font-mono-num text-[#D94E34] hover:underline cursor-pointer"
                              >
                                Remove Group
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {group.options.map((opt) => (
                              <div
                                key={opt.id}
                                className="flex items-center gap-1.5 bg-[#EAE9E4]/50 p-1.5 border border-[#141413]/10"
                              >
                                <input
                                  type="text"
                                  value={opt.label}
                                  onChange={(e) =>
                                    updateVariationOption(group.id, opt.id, {
                                      label: e.target.value,
                                    })
                                  }
                                  placeholder="Option (e.g. 1TB SSD)"
                                  className="flex-1 min-w-0 bg-[#F4F3EF] border border-[#141413]/15 px-2 py-1 text-xs text-[#141413]"
                                />
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[10px] font-mono-num text-[#6E6D68]">
                                    +$
                                  </span>
                                  <input
                                    type="number"
                                    value={opt.priceDelta}
                                    onChange={(e) =>
                                      updateVariationOption(group.id, opt.id, {
                                        priceDelta: Number(e.target.value),
                                      })
                                    }
                                    title="Price adjustment in USD (0 for base price)"
                                    className="w-16 bg-[#F4F3EF] border border-[#141413]/15 px-1.5 py-1 text-xs font-mono-num text-[#141413]"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeVariationOption(group.id, opt.id)
                                  }
                                  className="px-1.5 text-xs text-[#6E6D68] hover:text-[#D94E34] cursor-pointer"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6E6D68] font-mono-num">
                      Variations are turned ON. Click + Storage, + RAM, + Color,
                      or + Screen Size above to add options.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* SIMULTANEOUS 5-IMAGE UPLOADER & GALLERY SLOTS */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-[10px] font-mono-num uppercase text-[#141413] font-semibold">
                  Product Gallery — Upload up to 5 Images Simultaneously (
                  {prodForm.images.length}/5)
                </label>

                <label className="px-4 py-2 bg-[#141413] text-[#F4F3EF] text-[11px] font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] inline-flex items-center gap-2 cursor-pointer self-start">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select Up to 5 Images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 5 Visual Image Slots */}
              <div className="grid grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, slotIdx) => {
                  const imgUrl = prodForm.images[slotIdx];
                  return (
                    <div
                      key={slotIdx}
                      className="aspect-square bg-[#EAE9E4] border border-[#141413]/15 relative flex items-center justify-center p-2"
                    >
                      {imgUrl ? (
                        <>
                          <StudioImage
                            src={imgUrl}
                            alt={`Slot ${slotIdx + 1}`}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setProdForm((prev) => ({
                                ...prev,
                                images: prev.images.filter(
                                  (_, i) => i !== slotIdx
                                ),
                              }))
                            }
                            className="absolute top-1 right-1 w-5 h-5 bg-[#141413] text-[#F4F3EF] flex items-center justify-center text-[10px] cursor-pointer"
                          >
                            ×
                          </button>
                          <span className="absolute bottom-1 left-1 text-[9px] font-mono-num bg-[#F4F3EF]/90 px-1">
                            0{slotIdx + 1}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] font-mono-num text-[#8E8D87]">
                          Slot 0{slotIdx + 1}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick Studio Preset Adder */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono-num text-[#6E6D68] mr-1">
                  + Add Studio Preset:
                </span>
                {Object.entries(STUDIO_IMAGES).map(([key, url]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() =>
                      setProdForm((prev) => ({
                        ...prev,
                        images: [...prev.images, url].slice(0, 5),
                      }))
                    }
                    className="px-2 py-1 text-[10px] font-mono-num border border-[#141413]/20 bg-[#EAE9E4] hover:border-[#141413] cursor-pointer"
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* Placement Toggles */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prodForm.featured}
                  onChange={(e) =>
                    setProdForm({ ...prodForm, featured: e.target.checked })
                  }
                  className="accent-[#141413]"
                />
                <span>Show in Featured Technology Carousel</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prodForm.isNewArrival}
                  onChange={(e) =>
                    setProdForm({
                      ...prodForm,
                      isNewArrival: e.target.checked,
                    })
                  }
                  className="accent-[#141413]"
                />
                <span>Mark as New Release</span>
              </label>
            </div>

            <div className="pt-4 border-t border-[#141413]/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-5 py-2.5 border border-[#141413]/25 text-xs font-mono-num uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider cursor-pointer"
              >
                Publish & Sync to Storefront
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          OFFER CREATE / EDIT MODAL
         ===================================================================== */}
      {isOfferModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#141413]/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <form
            onSubmit={handleSaveOffer}
            className="bg-[#F4F3EF] border border-[#141413]/20 max-w-2xl w-full p-6 sm:p-8 my-8 space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#141413]/10">
              <h3 className="font-editorial text-2xl text-[#141413]">
                {editingOfferId
                  ? 'Edit Storefront Offer'
                  : 'Create Storefront Offer'}
              </h3>
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(false)}
                className="p-1 text-[#141413] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                  Offer Headline *
                </label>
                <input
                  type="text"
                  required
                  value={offerForm.title}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, title: e.target.value })
                  }
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                  Badge Label
                </label>
                <input
                  type="text"
                  value={offerForm.badgeText}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, badgeText: e.target.value })
                  }
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3 py-2 text-xs font-mono-num"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                  Discount Type
                </label>
                <select
                  value={offerForm.discountType}
                  onChange={(e) =>
                    setOfferForm({
                      ...offerForm,
                      discountType: e.target.value as 'percentage' | 'fixed',
                    })
                  }
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3 py-2 text-xs"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                  Discount Value
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={offerForm.discountValue}
                  onChange={(e) =>
                    setOfferForm({
                      ...offerForm,
                      discountValue: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3 py-2 text-xs font-mono-num"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={offerForm.startDate}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, startDate: e.target.value })
                  }
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-2.5 py-2 text-xs font-mono-num"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={offerForm.endDate}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, endDate: e.target.value })
                  }
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-2.5 py-2 text-xs font-mono-num"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-2">
                Select Products Included in Offer (
                {offerForm.productIds.length} selected)
              </label>
              <div className="max-h-44 overflow-y-auto border border-[#141413]/15 bg-[#EAE9E4]/40 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {products.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 text-xs text-[#141413] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={offerForm.productIds.includes(p.id)}
                      onChange={() => toggleProductInOfferForm(p.id)}
                      className="accent-[#141413]"
                    />
                    <span className="truncate">
                      {p.name} (${p.price})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={offerForm.enabled}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, enabled: e.target.checked })
                  }
                  className="accent-[#141413]"
                />
                <span>Enable Offer Immediately</span>
              </label>
            </div>

            <div className="pt-4 border-t border-[#141413]/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(false)}
                className="px-5 py-2.5 border border-[#141413]/25 text-xs font-mono-num uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider cursor-pointer"
              >
                Publish Offer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
