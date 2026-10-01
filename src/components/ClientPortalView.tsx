import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  LogOut,
  Package,
  RotateCcw,
  ShieldCheck,
  Truck,
  User,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus } from '../types/store';
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

export const ClientPortalView: React.FC = () => {
  const {
    currentClient,
    clients,
    orders,
    settings,
    loginClient,
    registerClient,
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

  // Profile edit state
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const ok = loginClient(email, password);
    if (!ok) {
      setAuthError(
        'Invalid email or password. Try a registered account or create a new client profile.'
      );
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setAuthError('Please complete all required fields.');
      return;
    }
    registerClient({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '+254 700 000 000',
      password: password.trim(),
      defaultAddress: address.trim() || 'Westlands',
      city: city.trim() || 'Nairobi',
    });
  };

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
            Track hardware orders, inspect serial warranties, and download
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

          {authError && (
            <div className="mt-4 p-3 bg-[#D94E34]/10 border border-[#D94E34]/30 text-xs text-[#D94E34]">
              {authError}
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
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
                className="w-full py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] transition-colors cursor-pointer"
              >
                Access Client Area
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
                      onClick={() => loginClient(demo.email, demo.password)}
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
            <form onSubmit={handleSignup} className="mt-6 space-y-3.5">
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
                className="w-full py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] transition-colors cursor-pointer mt-2"
              >
                Create Account & Enter Portal
              </button>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  // Orders belonging to this client (or all orders if demoing)
  const clientOrders = orders.filter(
    (o) =>
      o.clientId === currentClient.id ||
      o.customerEmail.toLowerCase() === currentClient.email.toLowerCase()
  );

  const displayedOrders = clientOrders.length > 0 ? clientOrders : orders;

  return (
    <div className="min-h-screen bg-[#F4F3EF] pb-20">
      {/* Top Client Banner */}
      <div className="showroom-canvas border-b border-[#141413]/12 py-10 px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-mono-num uppercase tracking-[0.22em] text-[#6E6D68]">
              TECH SOKONI · CLIENT PORTAL
            </p>
            <h1 className="font-editorial text-4xl sm:text-5xl text-[#141413] mt-1">
              Welcome, {currentClient.name}
            </h1>
            <p className="text-xs font-mono-num text-[#5E5D59] mt-1">
              {currentClient.email} · {currentClient.phone} ·{' '}
              {currentClient.defaultAddress}, {currentClient.city}
            </p>
          </div>

          <div className="flex items-center gap-3">
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

      {/* Portal Tabs */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-8">
        <div className="flex items-center gap-4 border-b border-[#141413]/10 pb-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-xs font-mono-num uppercase tracking-widest flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#141413] text-[#F4F3EF]'
                : 'bg-[#EAE9E4] text-[#5E5D59]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Orders, Progress & PDF Receipts ({displayedOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-xs font-mono-num uppercase tracking-widest flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#141413] text-[#F4F3EF]'
                : 'bg-[#EAE9E4] text-[#5E5D59]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Delivery Profile</span>
          </button>
        </div>

        {activeTab === 'orders' ? (
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
        ) : (
          <div className="py-8 max-w-xl space-y-4">
            <h2 className="font-editorial text-3xl text-[#141413]">
              Delivery & Contact Preferences
            </h2>
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
                Phone Number
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
          </div>
        )}
      </div>
    </div>
  );
};
