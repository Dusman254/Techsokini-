import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types/store';
import { downloadOrderReceiptPdf } from '../services/pdfReceiptService';
import { StudioImage } from './StudioImage';

export const CartAndCheckout: React.FC = () => {
  const {
    products,
    cart,
    savedForLater,
    settings,
    isCartOpen,
    setIsCartOpen,
    isCheckoutOpen,
    setIsCheckoutOpen,
    updateCartQuantity,
    removeFromCart,
    moveToSavedForLater,
    moveToCartFromSaved,
    removeFromSaved,
    getEffectivePricing,
    placeOrder,
    navigate,
  } = useStore();

  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('Nairobi');
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>(
    'M-Pesa Express'
  );
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const detailedCart = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        const pricing = getEffectivePricing(product);
        const delta = item.variationPriceDelta || 0;
        const unitOriginal = Math.max(1, pricing.originalPrice + delta);
        const unitFinal = Math.max(1, pricing.finalPrice + delta);
        return {
          ...item,
          itemKey: item.cartItemKey || item.productId,
          product,
          pricing,
          unitOriginal,
          unitFinal,
          lineOriginal: unitOriginal * item.quantity,
          lineFinal: unitFinal * item.quantity,
          lineDiscount: pricing.discountAmount * item.quantity,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
  }, [cart, products, getEffectivePricing]);

  const detailedSaved = useMemo(() => {
    return savedForLater
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        const pricing = getEffectivePricing(product);
        const delta = item.variationPriceDelta || 0;
        return {
          ...item,
          itemKey: item.cartItemKey || item.productId,
          product,
          pricing,
          unitFinal: Math.max(1, pricing.finalPrice + delta),
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
  }, [savedForLater, products, getEffectivePricing]);

  const subtotal = detailedCart.reduce((acc, i) => acc + i.lineOriginal, 0);
  const discountTotal = detailedCart.reduce((acc, i) => acc + i.lineDiscount, 0);
  const total = detailedCart.reduce((acc, i) => acc + i.lineFinal, 0);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (detailedCart.length === 0) return;

    const created = placeOrder({
      customerName: customerName.trim() || 'Showroom Client',
      customerEmail: customerEmail.trim() || 'client@techsokoni.com',
      customerPhone: customerPhone.trim() || '+254 700 000 000',
      shippingAddress: shippingAddress.trim() || 'Riverside Drive',
      city: city.trim() || 'Nairobi',
      paymentMethod,
      items: detailedCart.map((c) => ({
        productId: c.product.id,
        productName: c.product.name,
        brand: c.product.brand,
        sku: c.product.sku,
        quantity: c.quantity,
        unitPrice: c.unitFinal,
        originalPrice: c.unitOriginal,
        image: c.product.images[0],
        selectedVariations: c.selectedVariations,
      })),
      subtotal,
      discountTotal,
      total,
    });

    setConfirmedOrder(created);
  };

  return (
    <>
      {/* =====================================================================
          SLIDE-OUT CART DRAWER
         ===================================================================== */}
      {isCartOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Bag"
          className="fixed inset-0 z-50 flex justify-end bg-[#141413]/40 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-[#F4F3EF] h-full flex flex-col justify-between border-l border-[#141413]/15 shadow-2xl">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#141413]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span className="text-xs font-mono-num uppercase tracking-[0.2em] font-semibold text-[#141413]">
                  TECH SOKONI BAG ({detailedCart.length})
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                aria-label="Close bag"
                className="p-1 text-[#141413] hover:opacity-65 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#141413]/10">
              {detailedCart.length > 0 ? (
                detailedCart.map((item) => (
                  <div key={item.itemKey} className="py-5 flex gap-4">
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        navigate({
                          page: 'product',
                          productId: item.product.id,
                        });
                      }}
                      className="w-20 h-20 bg-[#EAE9E4] p-2 shrink-0 flex items-center justify-center cursor-pointer"
                    >
                      <StudioImage
                        src={item.product.images[0]}
                        alt={item.product.name}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-contain"
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                            {item.product.brand}
                          </p>
                          <h4 className="text-sm font-semibold text-[#141413] truncate">
                            {item.product.name}
                          </h4>
                          {item.selectedVariations &&
                            Object.keys(item.selectedVariations).length > 0 && (
                              <p className="text-[10px] font-mono-num text-[#5E5D59] mt-0.5">
                                {Object.entries(item.selectedVariations)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(' · ')}
                              </p>
                            )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.itemKey)}
                          aria-label="Remove item"
                          className="text-[#6E6D68] hover:text-[#D94E34] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Unit & Line Price */}
                      <div className="mt-1 flex items-baseline gap-2 font-mono-num text-xs">
                        <span className="font-semibold text-[#141413]">
                          {settings.currencySymbol}
                          {item.unitFinal.toLocaleString()}
                        </span>
                        {item.pricing.hasDiscount && (
                          <span className="text-[11px] text-[#8E8D87] line-through">
                            {settings.currencySymbol}
                            {item.unitOriginal.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Quantity Stepper & Save for Later */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center border border-[#141413]/20 bg-[#EAE9E4]/50">
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.itemKey,
                                item.quantity - 1
                              )
                            }
                            aria-label="Decrease quantity"
                            className="w-7 h-7 flex items-center justify-center text-[#141413] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-mono-num text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.itemKey,
                                item.quantity + 1
                              )
                            }
                            aria-label="Increase quantity"
                            className="w-7 h-7 flex items-center justify-center text-[#141413] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => moveToSavedForLater(item.itemKey)}
                          className="text-[11px] font-mono-num text-[#6E6D68] hover:text-[#141413] flex items-center gap-1 cursor-pointer"
                        >
                          <Bookmark className="w-3 h-3" />
                          <span>Save for later</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center space-y-3">
                  <p className="font-editorial text-2xl text-[#141413]">
                    Your Tech Sokoni bag is empty.
                  </p>
                  <p className="text-xs text-[#6E6D68]">
                    Explore our curated laptops, smartphones, monitors, and
                    accessories.
                  </p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate({ page: 'category', categoryId: 'all' });
                    }}
                    className="mt-2 px-5 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-widest cursor-pointer"
                  >
                    Explore Hardware
                  </button>
                </div>
              )}

              {/* Saved for Later Section */}
              {detailedSaved.length > 0 && (
                <div className="pt-6">
                  <p className="text-[11px] font-mono-num uppercase tracking-[0.18em] text-[#6E6D68] mb-3">
                    Saved for Later ({detailedSaved.length})
                  </p>
                  <div className="space-y-3">
                    {detailedSaved.map((saved) => (
                      <div
                        key={saved.productId}
                        className="p-3 bg-[#EAE9E4]/60 border border-[#141413]/10 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#141413] truncate">
                            {saved.product.name}
                          </p>
                          <p className="text-xs font-mono-num text-[#6E6D68]">
                            {settings.currencySymbol}
                            {saved.pricing.finalPrice.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              moveToCartFromSaved(saved.productId)
                            }
                            className="px-2.5 py-1 bg-[#141413] text-[#F4F3EF] text-[10px] font-mono-num uppercase tracking-wider cursor-pointer"
                          >
                            Move to Bag
                          </button>
                          <button
                            onClick={() => removeFromSaved(saved.productId)}
                            aria-label="Remove saved item"
                            className="text-[#6E6D68] hover:text-[#D94E34] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Totals & Checkout CTA */}
            {detailedCart.length > 0 && (
              <div className="p-6 bg-[#EAE9E4]/80 border-t border-[#141413]/12 space-y-4">
                <div className="space-y-1.5 text-xs font-mono-num">
                  <div className="flex justify-between text-[#5E5D59]">
                    <span>Subtotal</span>
                    <span>
                      {settings.currencySymbol}
                      {subtotal.toLocaleString()}
                    </span>
                  </div>
                  {discountTotal > 0 && (
                    <div className="flex justify-between text-[#1F6F43]">
                      <span>Active Offer Privilege</span>
                      <span>
                        −{settings.currencySymbol}
                        {discountTotal.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#5E5D59]">
                    <span>Courier Delivery</span>
                    <span>
                      {total >= settings.freeShippingThreshold
                        ? 'Complimentary'
                        : `${settings.currencySymbol}25`}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#141413]/10 flex justify-between text-base font-semibold text-[#141413]">
                    <span>Total</span>
                    <span>
                      {settings.currencySymbol}
                      {(
                        total +
                        (total >= settings.freeShippingThreshold ? 0 : 25)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setConfirmedOrder(null);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          CHECKOUT & ORDER CONFIRMATION MODAL
         ===================================================================== */}
      {isCheckoutOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tech Sokoni Checkout"
          className="fixed inset-0 z-50 bg-[#141413]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-[#F4F3EF] border border-[#141413]/20 max-w-2xl w-full p-6 sm:p-10 my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-6 border-b border-[#141413]/10">
              <span className="text-xs font-mono-num uppercase tracking-[0.2em] text-[#6E6D68]">
                TECH SOKONI · DIRECT DISPATCH CHECKOUT
              </span>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-xs font-mono-num uppercase tracking-widest text-[#141413] hover:opacity-70 cursor-pointer"
              >
                Close
              </button>
            </div>

            {confirmedOrder ? (
              <div className="py-10 text-center space-y-5">
                <CheckCircle2 className="w-12 h-12 text-[#1F6F43] mx-auto stroke-[1.5]" />
                <div>
                  <p className="text-xs font-mono-num uppercase tracking-[0.2em] text-[#1F6F43]">
                    ORDER CONFIRMED · {confirmedOrder.orderNumber}
                  </p>
                  <h3 className="font-editorial text-3xl sm:text-4xl text-[#141413] mt-1">
                    Thank you, {confirmedOrder.customerName}.
                  </h3>
                  <p className="text-xs text-[#5E5D59] mt-2 max-w-md mx-auto">
                    Your order has been logged in the Tech Sokoni Dispatch Console
                    and is being prepared for insured delivery to{' '}
                    {confirmedOrder.shippingAddress}, {confirmedOrder.city}.
                  </p>
                </div>

                <div className="bg-[#EAE9E4] p-4 max-w-md mx-auto text-left text-xs font-mono-num space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#6E6D68]">Order Reference:</span>
                    <span className="font-semibold">
                      {confirmedOrder.orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6E6D68]">Payment Method:</span>
                    <span>{confirmedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#141413]/10 text-sm font-semibold">
                    <span>Total Paid / Authorised:</span>
                    <span>
                      {settings.currencySymbol}
                      {confirmedOrder.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() =>
                      downloadOrderReceiptPdf(confirmedOrder, settings)
                    }
                    className="px-5 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-widest hover:bg-[#2B2B28] cursor-pointer"
                  >
                    Download PDF Receipt
                  </button>
                  <button
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setConfirmedOrder(null);
                      navigate({ page: 'client-portal' });
                    }}
                    className="px-5 py-2.5 border border-[#141413] text-[#141413] text-xs font-mono-num uppercase tracking-widest hover:bg-[#141413] hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Track Order Progress
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="pt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Eng.Brian Kiprop"
                      className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2.5 text-xs text-[#141413]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+254 7..."
                      className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2.5 text-xs text-[#141413]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1.5">
                      Email for Serial & Warranty Receipt *
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2.5 text-xs text-[#141413]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1.5">
                      City / Region *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2.5 text-xs text-[#141413]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1.5">
                    Delivery Street / Building / Suite *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="e.g. 4th Floor, Delta Corner, Westlands"
                    className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2.5 text-xs text-[#141413]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(
                      [
                        'M-Pesa Express',
                        'Card / Apple Pay',
                        'Bank Transfer',
                        'Cash on Delivery',
                      ] as const
                    ).map((method) => (
                      <button
                        type="button"
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2.5 px-3 text-xs font-mono-num border text-center transition-colors cursor-pointer ${
                          paymentMethod === method
                            ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                            : 'bg-[#EAE9E4]/40 text-[#141413] border-[#141413]/15'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#EAE9E4] p-4 flex items-center justify-between text-sm font-mono-num">
                  <span>
                    Order Total ({detailedCart.length}{' '}
                    {detailedCart.length === 1 ? 'item' : 'items'})
                  </span>
                  <span className="text-lg font-semibold text-[#141413]">
                    {settings.currencySymbol}
                    {total.toLocaleString()}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] transition-colors cursor-pointer"
                >
                  Complete Order ({settings.currencySymbol}
                  {total.toLocaleString()})
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
