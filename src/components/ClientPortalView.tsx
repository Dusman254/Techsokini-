import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  History,
  LogOut,
  Package,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
  Truck,
  User,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { OrderStatus } from '../types/store';
import { PdfReceiptService } from '../services/pdfReceiptService';
import { StudioImage } from './StudioImage';

const PROGRESS_STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: 'Processing', label: 'Order Confirmed' },
  { status: 'Packed & Verified', label: 'Serial Verified & Packed' },
  { status: 'Dispatched', label: 'In Transit / Dispatched' },
  { status: 'Delivered', label: 'Delivered' },
];

function getStepIndex(status: OrderStatus): number {
  if (status === 'Processing') return 0;
  if (status === 'Packed & Verified') return 1;
  if (status === 'Dispatched') return 2;
  if (status === 'Delivered') return 3;
  return -1; // Cancelled
}

const GoogleMarkSvg: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
    />
  </svg>
);

export const ClientPortalView: React.FC = () => {
  const {
    currentClient,
    clients,
    orders,
    settings,
    route,
    loginClient,
    registerClient,
    loginWithGoogle,
    logoutClient,
    updateClientProfile,
    cancelClientOrder,
    addToCart,
    navigate,
  } = useStore();

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Nairobi');
  const [authError, setAuthError] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Portal view tabs: 'orders' (Live Progress), 'history' (Past Order History), 'profile' (Delivery Profile)
  const [activeTab, setActiveTab] = useState<'orders' | 'history' | 'profile'>(
    route.page === 'client-portal' && route.tab ? route.tab : 'orders'
  );

  // Sync activeTab if route specifies a tab
  useEffect(() => {
    if (route.page === 'client-portal' && route.tab) {
      setActiveTab(route.tab);
    }
  }, [route]);

  // Order History Filter States
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState<
    'all' | 'M-Pesa Express' | 'Payment on Delivery'
  >('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<
    'all' | OrderStatus
  >('all');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmittingAuth(true);
    try {
      const res = await loginClient(email, password);
      if (!res.ok) {
        setAuthError(
          res.error ||
            'Invalid email or password. Try a registered account or create a new client profile.'
        );
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setAuthError('Please complete all required fields.');
      return;
    }
    if (password.trim().length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    setIsSubmittingAuth(true);
    try {
      const res = await registerClient({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || '+254 700 000 000',
        password: password.trim(),
        defaultAddress: address.trim() || 'Westlands',
        city: city.trim() || 'Nairobi',
      });
      if (!res.ok && res.error) {
        setAuthError(res.error);
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    setIsSubmittingAuth(true);
    try {
      const res = await loginWithGoogle();
      if (!res.ok && res.error) {
        setAuthError(res.error);
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Orders belonging to this client (or all orders if demoing)
  const displayedOrders = useMemo(() => {
    if (!currentClient) return orders;
    const clientOrders = orders.filter(
      (o) =>
        o.clientId === currentClient.id ||
        o.customerEmail.toLowerCase() === currentClient.email.toLowerCase()
    );
    return clientOrders.length > 0 ? clientOrders : orders;
  }, [orders, currentClient]);

  // Filtered orders for the Order History tab
  const filteredHistoryOrders = useMemo(() => {
    const q = historySearchQuery.trim().toLowerCase();
    return displayedOrders.filter((order) => {
      if (
        historyPaymentFilter !== 'all' &&
        order.paymentMethod !== historyPaymentFilter
      ) {
        return false;
      }
      if (
        historyStatusFilter !== 'all' &&
        order.status !== historyStatusFilter
      ) {
        return false;
      }
      if (q) {
        const productNames = order.items
          .map((i) => `${i.productName} ${i.brand} ${i.sku}`)
          .join(' ')
          .toLowerCase();
        const haystack = `${order.orderNumber} ${order.paymentMethod} ${order.status} ${order.city} ${order.shippingAddress} ${productNames}`.toLowerCase();
        return haystack.includes(q);
      }
      return true;
    });
  }, [
    displayedOrders,
    historyPaymentFilter,
    historyStatusFilter,
    historySearchQuery,
  ]);

  // Summary metrics for Order History
  const historyStats = useMemo(() => {
    const mpesaOrders = displayedOrders.filter(
      (o) => o.paymentMethod === 'M-Pesa Express'
    );
    const podOrders = displayedOrders.filter(
      (o) => o.paymentMethod === 'Payment on Delivery'
    );
    const deliveredOrders = displayedOrders.filter(
      (o) => o.status === 'Delivered'
    );
    return {
      totalCount: displayedOrders.length,
      mpesaCount: mpesaOrders.length,
      mpesaTotal: mpesaOrders.reduce((sum, o) => sum + o.total, 0),
      podCount: podOrders.length,
      podTotal: podOrders.reduce((sum, o) => sum + o.total, 0),
      deliveredCount: deliveredOrders.length,
    };
  }, [displayedOrders]);

  if (!currentClient) {
    return (
      <div className="min-h-[82vh] showroom-canvas flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#F4F3EF] border border-[#141413]/15 max-w-md w-full p-6 sm:p-10 shadow-xl"
        >
          <p className="text-[11px] font-mono-num uppercase tracking-[0.22em] text-[#6E6D68] text-center">
            TECH SOKONI · CLIENT CONCIERGE
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#141413] text-center mt-1">
            {authMode === 'login' ? 'Client Sign In' : 'Create Client Account'}
          </h1>
          <p className="text-xs text-[#6E6D68] text-center mt-1.5">
            Track hardware orders, view M-Pesa & delivery history, and download
            official PDF receipts.
          </p>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 border border-[#141413]/15 mt-6 text-xs font-mono-num uppercase tracking-wider">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
              }}
              className={`py-2.5 cursor-pointer transition-colors ${
                authMode === 'login'
                  ? 'bg-[#141413] text-[#F4F3EF]'
                  : 'text-[#6E6D68] hover:text-[#141413]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setAuthError('');
              }}
              className={`py-2.5 cursor-pointer transition-colors ${
                authMode === 'signup'
                  ? 'bg-[#141413] text-[#F4F3EF]'
                  : 'text-[#6E6D68] hover:text-[#141413]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Google Sign-In Button (Present on BOTH Sign In and Sign Up) */}
          <div className="mt-5">
            <button
              type="button"
              disabled={isSubmittingAuth}
              onClick={handleGoogleAuth}
              className="w-full py-3 px-4 bg-white hover:bg-[#EAE9E4]/80 border border-[#141413]/20 text-[#141413] text-xs font-mono-num uppercase tracking-wider flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-60"
            >
              <GoogleMarkSvg className="w-4 h-4 shrink-0" />
              <span>
                {authMode === 'login'
                  ? 'Sign In with Google'
                  : 'Sign Up with Google'}
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="border-t border-[#141413]/12 w-full" />
            <span className="bg-[#F4F3EF] px-3 text-[10px] font-mono-num uppercase tracking-widest text-[#6E6D68] shrink-0">
              Or with Email
            </span>
            <div className="border-t border-[#141413]/12 w-full" />
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-[#D94E34]/10 border border-[#D94E34]/30 text-xs text-[#D94E34]">
              {authError}
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                  Client Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="clara@atelierdesign.africa"
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2.5 text-xs text-[#141413]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2.5 text-xs text-[#141413]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] transition-colors cursor-pointer disabled:opacity-60"
              >
                {isSubmittingAuth ? 'Signing In...' : 'Access Client Area'}
              </button>

              {/* Quick Demo Account Access */}
              <div className="pt-4 border-t border-[#141413]/10 space-y-2">
                <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                  Instant Demo Client Profiles:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {clients.slice(0, 2).map((demo) => (
                    <button
                      type="button"
                      key={demo.id}
                      onClick={() => {
                        loginClient(demo.email, demo.password || 'demo');
                      }}
                      className="w-full py-2 px-3 bg-[#EAE9E4] hover:bg-[#E0DFD9] border border-[#141413]/12 text-left text-xs flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-medium text-[#141413] truncate">
                        {demo.name} ({demo.email})
                      </span>
                      <span className="font-mono-num text-[10px] uppercase text-[#141413] shrink-0 ml-2">
                        1-Click Sign In →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nadia Mutua"
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs text-[#141413]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nadia@studio.co"
                    className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 7..."
                    className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs text-[#141413]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                    Default Delivery Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Suite / Street"
                    className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs text-[#141413]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                  Create Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs text-[#141413]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] transition-colors cursor-pointer mt-2 disabled:opacity-60"
              >
                {isSubmittingAuth
                  ? 'Creating Account...'
                  : 'Create Account & Enter Portal'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F3EF] pb-20">
      {/* Top Client Banner */}
      <div className="showroom-canvas border-b border-[#141413]/12 py-8 sm:py-10 px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            {currentClient.photoURL && (
              <img
                src={currentClient.photoURL}
                alt={currentClient.name}
                className="w-12 h-12 rounded-full border border-[#141413]/20 object-cover shrink-0"
              />
            )}
            <div>
              <p className="text-[11px] font-mono-num uppercase tracking-[0.22em] text-[#6E6D68]">
                TECH SOKONI · CLIENT PORTAL
              </p>
              <h1 className="font-editorial text-3xl sm:text-5xl text-[#141413] mt-1">
                Welcome, {currentClient.name}
              </h1>
              <p className="text-xs font-mono-num text-[#5E5D59] mt-1">
                {currentClient.email} · {currentClient.phone} ·{' '}
                {currentClient.defaultAddress}, {currentClient.city}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate({ page: 'category', categoryId: 'all' })}
              className="px-4 py-2 border border-[#141413]/25 text-xs font-mono-num uppercase tracking-wider text-[#141413] hover:border-[#141413] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Shop Hardware</span>
            </button>
            <button
              onClick={logoutClient}
              className="px-4 py-2 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Portal Navigation Tabs */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-8">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 border-b border-[#141413]/10 pb-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 text-xs font-mono-num uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'orders'
                ? 'bg-[#141413] text-[#F4F3EF]'
                : 'bg-[#EAE9E4] text-[#5E5D59] hover:text-[#141413]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Live Order Tracking ({displayedOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-mono-num uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'history'
                ? 'bg-[#141413] text-[#F4F3EF]'
                : 'bg-[#EAE9E4] text-[#5E5D59] hover:text-[#141413]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Order History · M-Pesa & Delivery ({displayedOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-xs font-mono-num uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'profile'
                ? 'bg-[#141413] text-[#F4F3EF]'
                : 'bg-[#EAE9E4] text-[#5E5D59] hover:text-[#141413]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Delivery Profile</span>
          </button>
        </div>

        {/* =====================================================================
            VIEW 1: LIVE ORDERS, PROGRESS & PDF RECEIPTS
           ===================================================================== */}
        {activeTab === 'orders' && (
          <div className="py-8 space-y-6">
            {displayedOrders.map((order) => {
              const currentStepIdx = getStepIndex(order.status);
              const isCancelled = order.status === 'Cancelled';

              return (
                <div
                  key={order.id}
                  className="bg-[#EAE9E4]/55 border border-[#141413]/12 p-5 sm:p-8 space-y-6"
                >
                  {/* Order Top Header & PDF Receipt Download Button */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#141413]/10">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono-num">
                        <span className="font-semibold text-sm text-[#141413]">
                          {order.orderNumber}
                        </span>
                        <span>·</span>
                        <span className="text-[#6E6D68]">
                          Placed{' '}
                          {new Date(order.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: '2-digit',
                            }
                          )}
                        </span>
                        <span>·</span>
                        <span className="text-[#141413]">
                          {order.paymentMethod}
                        </span>
                      </div>
                      <p className="text-xs text-[#5E5D59] mt-1">
                        Destination: {order.shippingAddress}, {order.city}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Download Official Branded PDF Receipt */}
                      <button
                        onClick={() =>
                          PdfReceiptService.generateAndDownloadReceipt(
                            order,
                            settings
                          )
                        }
                        className="px-4 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF Receipt</span>
                      </button>

                      {/* Reorder button */}
                      <button
                        onClick={() => {
                          order.items.forEach((item) =>
                            addToCart(
                              item.productId,
                              item.quantity,
                              true,
                              item.selectedVariations
                            )
                          );
                        }}
                        className="px-3.5 py-2.5 border border-[#141413]/25 text-[#141413] text-xs font-mono-num uppercase tracking-wider hover:border-[#141413] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reorder</span>
                      </button>

                      {/* Cancel if still Processing */}
                      {order.status === 'Processing' && (
                        <button
                          onClick={() => cancelClientOrder(order.id)}
                          className="px-3.5 py-2.5 border border-[#D94E34]/40 text-[#D94E34] text-xs font-mono-num uppercase tracking-wider hover:bg-[#D94E34] hover:text-[#F4F3EF] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* LIVE 4-STAGE FULFILLMENT PROGRESS TRACKER */}
                  <div className="bg-[#F4F3EF] border border-[#141413]/10 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-mono-num uppercase tracking-[0.18em] text-[#6E6D68]">
                        Live Fulfillment Progress
                      </span>
                      <span
                        className={`text-xs font-mono-num font-semibold uppercase ${
                          isCancelled ? 'text-[#D94E34]' : 'text-[#1F6F43]'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {isCancelled ? (
                      <div className="py-3 text-xs font-mono-num text-[#D94E34]">
                        This order was cancelled prior to dispatch.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        {PROGRESS_STEPS.map((step, idx) => {
                          const isCompleted = idx <= currentStepIdx;
                          const isCurrent = idx === currentStepIdx;
                          return (
                            <div
                              key={step.status}
                              className={`p-3 border transition-colors ${
                                isCurrent
                                  ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                                  : isCompleted
                                  ? 'bg-[#EAE9E4] text-[#141413] border-[#141413]/20'
                                  : 'bg-transparent text-[#6E6D68] border-[#141413]/10'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono-num">
                                <span>STAGE 0{idx + 1}</span>
                                {isCompleted ? (
                                  <CheckCircle2
                                    className={`w-3.5 h-3.5 ${
                                      isCurrent
                                        ? 'text-[#F4F3EF]'
                                        : 'text-[#1F6F43]'
                                    }`}
                                  />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 opacity-50" />
                                )}
                              </div>
                              <p className="text-xs font-semibold mt-1">
                                {step.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Ordered Hardware Items (Horizontal compact design) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.items.map((item, i) => (
                      <div
                        key={i}
                        className="bg-[#F4F3EF] border border-[#141413]/10 p-3.5 flex items-center gap-4"
                      >
                        <div className="w-16 h-16 bg-[#EAE9E4] p-2 shrink-0 flex items-center justify-center">
                          <StudioImage
                            src={item.image}
                            alt={item.productName}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-mono-num uppercase text-[#6E6D68]">
                            {item.brand} · SKU {item.sku}
                          </p>
                          <p className="text-xs sm:text-sm font-semibold text-[#141413] truncate">
                            {item.productName}
                          </p>
                          {item.selectedVariations &&
                            Object.keys(item.selectedVariations).length > 0 && (
                              <p className="text-[10px] font-mono-num text-[#5E5D59] truncate mt-0.5">
                                {Object.entries(item.selectedVariations)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(' · ')}
                              </p>
                            )}
                          <p className="text-xs font-mono-num text-[#5E5D59] mt-0.5">
                            Qty: {item.quantity} × {settings.currencySymbol}
                            {item.unitPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Total Footer */}
                  <div className="pt-3 border-t border-[#141413]/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono-num">
                    <div className="flex items-center gap-2 text-[#1F6F43]">
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        Official Tech Sokoni Serial & Warranty Registered
                      </span>
                    </div>
                    <div className="flex items-baseline gap-4">
                      {order.discountTotal > 0 && (
                        <span className="text-[#1F6F43]">
                          Privilege Saved: −{settings.currencySymbol}
                          {order.discountTotal.toLocaleString()}
                        </span>
                      )}
                      <span className="text-base font-semibold text-[#141413]">
                        Total Paid: {settings.currencySymbol}
                        {order.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =====================================================================
            VIEW 2: PAST ORDER HISTORY (M-PESA EXPRESS & DELIVERY TRANSACTIONS)
           ===================================================================== */}
        {activeTab === 'history' && (
          <div className="py-8 space-y-8">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-mono-num uppercase tracking-[0.22em] text-[#6E6D68]">
                  ARCHIVE LEDGER · M-PESA TILL 9309020 & COURIER DELIVERY
                </p>
                <h2 className="font-editorial text-3xl sm:text-4xl text-[#141413] mt-1">
                  Past Order & Transaction History
                </h2>
                <p className="text-xs text-[#5E5D59] mt-1">
                  Complete record of your ordered products, transaction dates,
                  and fulfillment statuses across M-Pesa Express and Payment on
                  Delivery orders.
                </p>
              </div>
            </div>

            {/* Transaction Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#EAE9E4]/60 border border-[#141413]/12 p-4">
                <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                  Total Transactions
                </p>
                <p className="font-editorial text-3xl text-[#141413] mt-1">
                  {historyStats.totalCount} Orders
                </p>
                <p className="text-[11px] font-mono-num text-[#5E5D59] mt-1">
                  {historyStats.deliveredCount} Delivered · Serial Verified
                </p>
              </div>

              <div className="bg-[#EAE9E4]/60 border border-[#141413]/12 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#1F6F43]">
                    M-Pesa Express (Till 9309020)
                  </p>
                  <Smartphone className="w-3.5 h-3.5 text-[#1F6F43]" />
                </div>
                <p className="font-editorial text-3xl text-[#141413] mt-1">
                  {settings.currencySymbol}
                  {historyStats.mpesaTotal.toLocaleString()}
                </p>
                <p className="text-[11px] font-mono-num text-[#5E5D59] mt-1">
                  {historyStats.mpesaCount} M-Pesa Transactions
                </p>
              </div>

              <div className="bg-[#EAE9E4]/60 border border-[#141413]/12 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#141413]">
                    Payment on Delivery
                  </p>
                  <Truck className="w-3.5 h-3.5 text-[#141413]" />
                </div>
                <p className="font-editorial text-3xl text-[#141413] mt-1">
                  {settings.currencySymbol}
                  {historyStats.podTotal.toLocaleString()}
                </p>
                <p className="text-[11px] font-mono-num text-[#5E5D59] mt-1">
                  {historyStats.podCount} Pay-on-Delivery Orders
                </p>
              </div>

              <div className="bg-[#EAE9E4]/60 border border-[#141413]/12 p-4">
                <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                  Showroom Support
                </p>
                <p className="text-sm font-mono-num font-semibold text-[#141413] mt-2">
                  {settings.supportPhone}
                </p>
                <p className="text-[11px] text-[#5E5D59] mt-1 truncate">
                  Kenyatta Pioneer Bldg, 5th Flr, Shop 514
                </p>
              </div>
            </div>

            {/* Filter & Search Bar for Past Order History */}
            <div className="bg-[#EAE9E4]/45 border border-[#141413]/12 p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Payment Method Filter */}
                <div className="lg:col-span-5">
                  <span className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1.5">
                    Transaction Type
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'All Transactions' },
                        { id: 'M-Pesa Express', label: 'M-Pesa Express' },
                        {
                          id: 'Payment on Delivery',
                          label: 'Payment on Delivery',
                        },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setHistoryPaymentFilter(tab.id)}
                        className={`px-3 py-1.5 text-xs font-mono-num transition-colors cursor-pointer border ${
                          historyPaymentFilter === tab.id
                            ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                            : 'bg-[#F4F3EF] text-[#5E5D59] border-[#141413]/15 hover:text-[#141413]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order Status Filter */}
                <div className="lg:col-span-4">
                  <span className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1.5">
                    Order Status
                  </span>
                  <select
                    value={historyStatusFilter}
                    onChange={(e) =>
                      setHistoryStatusFilter(
                        e.target.value as 'all' | OrderStatus
                      )
                    }
                    className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-3 py-1.5 text-xs font-mono-num text-[#141413] focus:outline-none"
                  >
                    <option value="all">All Order Statuses</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Packed & Verified">Packed & Verified</option>
                    <option value="Processing">Processing</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Search Product Name or Order # */}
                <div className="lg:col-span-3">
                  <span className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1.5">
                    Filter by Product or Order #
                  </span>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#6E6D68] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      placeholder="e.g. MacBook, LaserJet, 1041..."
                      className="w-full bg-[#F4F3EF] border border-[#141413]/15 pl-8 pr-3 py-1.5 text-xs text-[#141413] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order History Table (Desktop) & Structured Cards (Mobile) */}
            {filteredHistoryOrders.length > 0 ? (
              <div className="space-y-4">
                {/* Desktop Ledger Header */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-5 py-3 bg-[#141413] text-[#F4F3EF] text-[10px] font-mono-num uppercase tracking-[0.18em]">
                  <div className="col-span-2">Order & Date</div>
                  <div className="col-span-4">Products & Specifications</div>
                  <div className="col-span-2">Payment & Delivery</div>
                  <div className="col-span-2">Order Status</div>
                  <div className="col-span-2 text-right">Total & Actions</div>
                </div>

                {filteredHistoryOrders.map((order) => {
                  const formattedDate = new Date(
                    order.createdAt
                  ).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                  });
                  const formattedTime = new Date(
                    order.createdAt
                  ).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const isMpesa = order.paymentMethod === 'M-Pesa Express';

                  return (
                    <div
                      key={order.id}
                      className="bg-[#EAE9E4]/55 border border-[#141413]/12 p-4 sm:p-5 lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center space-y-4 lg:space-y-0"
                    >
                      {/* Col 1: Order Number & Date */}
                      <div className="lg:col-span-2">
                        <p className="text-xs font-mono-num font-semibold text-[#141413]">
                          {order.orderNumber}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs font-mono-num text-[#5E5D59] mt-1">
                          <Calendar className="w-3.5 h-3.5 text-[#6E6D68] shrink-0" />
                          <span>{formattedDate}</span>
                        </div>
                        <p className="text-[10px] font-mono-num text-[#6E6D68] mt-0.5">
                          {formattedTime}
                        </p>
                      </div>

                      {/* Col 2: Product Names, Quantities & SKUs */}
                      <div className="lg:col-span-4 space-y-2.5">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 bg-[#F4F3EF] border border-[#141413]/10 p-2.5"
                          >
                            <div className="w-11 h-11 bg-[#EAE9E4] p-1 shrink-0 flex items-center justify-center">
                              <StudioImage
                                src={item.image}
                                alt={item.productName}
                                containerClassName="w-full h-full"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-[#141413] truncate">
                                {item.productName}
                              </p>
                              <p className="text-[10px] font-mono-num text-[#6E6D68] truncate">
                                {item.brand} · {item.sku} · Qty {item.quantity} ×{' '}
                                {settings.currencySymbol}
                                {item.unitPrice.toLocaleString()}
                              </p>
                              {item.selectedVariations &&
                                Object.keys(item.selectedVariations).length >
                                  0 && (
                                  <p className="text-[10px] font-mono-num text-[#5E5D59] truncate">
                                    {Object.entries(item.selectedVariations)
                                      .map(([k, v]) => `${k}: ${v}`)
                                      .join(' · ')}
                                  </p>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Col 3: Payment Method (M-Pesa vs Payment on Delivery) & Destination */}
                      <div className="lg:col-span-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono-num font-semibold text-[#141413]">
                          {isMpesa ? (
                            <Smartphone className="w-3.5 h-3.5 text-[#1F6F43] shrink-0" />
                          ) : (
                            <Truck className="w-3.5 h-3.5 text-[#141413] shrink-0" />
                          )}
                          <span>{order.paymentMethod}</span>
                        </div>
                        <p className="text-[11px] font-mono-num text-[#5E5D59] mt-1">
                          {isMpesa
                            ? 'Lipa na M-Pesa Till 9309020'
                            : 'Inspect & Pay Courier on Arrival'}
                        </p>
                        <p className="text-[11px] text-[#6E6D68] mt-0.5 truncate">
                          {order.shippingAddress}, {order.city}
                        </p>
                      </div>

                      {/* Col 4: Order Status */}
                      <div className="lg:col-span-2">
                        <div className="inline-flex items-center gap-1.5 text-xs font-mono-num font-semibold uppercase">
                          {order.status === 'Delivered' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#1F6F43]" />
                          ) : order.status === 'Cancelled' ? (
                            <XCircle className="w-3.5 h-3.5 text-[#D94E34]" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-[#141413]" />
                          )}
                          <span
                            className={
                              order.status === 'Delivered'
                                ? 'text-[#1F6F43]'
                                : order.status === 'Cancelled'
                                ? 'text-[#D94E34]'
                                : 'text-[#141413]'
                            }
                          >
                            {order.status}
                          </span>
                        </div>
                        {order.trackingNote && (
                          <p className="text-[11px] text-[#5E5D59] mt-1 line-clamp-2">
                            {order.trackingNote}
                          </p>
                        )}
                      </div>

                      {/* Col 5: Total & Quick Actions */}
                      <div className="lg:col-span-2 flex flex-row lg:flex-col items-center lg:items-end justify-between gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#141413]/10">
                        <div className="lg:text-right">
                          <p className="text-[10px] font-mono-num uppercase text-[#6E6D68]">
                            Order Total
                          </p>
                          <p className="text-base font-mono-num font-semibold text-[#141413]">
                            {settings.currencySymbol}
                            {order.total.toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              PdfReceiptService.generateAndDownloadReceipt(
                                order,
                                settings
                              )
                            }
                            className="px-2.5 py-1.5 bg-[#141413] text-[#F4F3EF] text-[10px] font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] flex items-center gap-1 cursor-pointer"
                            title="Download Branded PDF Receipt"
                          >
                            <Download className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              order.items.forEach((item) =>
                                addToCart(
                                  item.productId,
                                  item.quantity,
                                  true,
                                  item.selectedVariations
                                )
                              );
                            }}
                            className="px-2.5 py-1.5 border border-[#141413]/25 text-[#141413] text-[10px] font-mono-num uppercase tracking-wider hover:border-[#141413] flex items-center gap-1 cursor-pointer"
                            title="Reorder Items"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reorder</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center bg-[#EAE9E4]/40 border border-[#141413]/12 space-y-3">
                <p className="text-sm font-medium text-[#141413]">
                  No past orders matched your selected filter criteria.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setHistoryPaymentFilter('all');
                    setHistoryStatusFilter('all');
                    setHistorySearchQuery('');
                  }}
                  className="px-4 py-2 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider cursor-pointer"
                >
                  Show All Past Orders
                </button>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            VIEW 3: DELIVERY & CONTACT PROFILE
           ===================================================================== */}
        {activeTab === 'profile' && (
          <div className="py-8 max-w-xl space-y-4">
            <h2 className="font-editorial text-3xl text-[#141413]">
              Delivery & Contact Preferences
            </h2>
            <p className="text-xs text-[#6E6D68]">
              Your delivery preferences are automatically synced with your Tech
              Sokoni Firestore profile for express checkout.
            </p>
            <div>
              <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={currentClient.name}
                onChange={(e) => updateClientProfile({ name: e.target.value })}
                className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                Phone Number (M-Pesa & Express Rider Contact)
              </label>
              <input
                type="text"
                value={currentClient.phone}
                onChange={(e) => updateClientProfile({ phone: e.target.value })}
                className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                Default Delivery Address
              </label>
              <input
                type="text"
                value={currentClient.defaultAddress}
                onChange={(e) =>
                  updateClientProfile({ defaultAddress: e.target.value })
                }
                className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                City / Town
              </label>
              <input
                type="text"
                value={currentClient.city}
                onChange={(e) => updateClientProfile({ city: e.target.value })}
                className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
