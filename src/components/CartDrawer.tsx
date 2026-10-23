import React, { useState } from 'react';
import { CartItem } from '../types/product';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../utils/audio';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  currency: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currency,
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  if (!isOpen) return null;

  // Currency Converter
  const formatPrice = (usd: number) => {
    switch (currency) {
      case 'EUR':
        return `€${Math.round(usd * 0.92)}`;
      case 'GBP':
        return `£${Math.round(usd * 0.79)}`;
      case 'JPY':
        return `¥${Math.round(usd * 152).toLocaleString()}`;
      default:
        return `$${usd.toFixed(2)}`;
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = subtotal * appliedDiscount;
  const shipping = subtotal > 150 || items.length === 0 ? 0 : 15;
  const total = Math.max(0, subtotal - discountAmount + shipping);

  const applyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'STREETWEAR10' || code === 'DROP04' || code === 'ARCHIVE') {
      setAppliedDiscount(0.1);
      setPromoMessage('10% VIP DROP DISCOUNT APPLIED');
      soundEngine.playAddToCart();
    } else {
      setPromoMessage('INVALID CODE. TRY "STREETWEAR10"');
    }
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    soundEngine.playAddToCart();

    setTimeout(() => {
      setIsCheckingOut(false);
      setOrderComplete(true);
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#e11d48', '#38bdf8', '#fbbf24'],
      });
      onClearCart();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => {
          soundEngine.playClick();
          onClose();
        }}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-out Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-800 flex flex-col text-zinc-200 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <h3 className="font-['Syne'] font-extrabold text-lg text-white">
                YOUR SHOPPING BAG
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {items.reduce((acc, it) => acc + it.quantity, 0)} ITEMS
              </span>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {orderComplete ? (
              <div className="py-16 text-center space-y-4">
                <CheckCircle2 size={56} className="mx-auto text-emerald-400" />
                <h4 className="font-['Syne'] font-extrabold text-2xl text-white">
                  ORDER CONFIRMED
                </h4>
                <p className="text-xs font-mono text-zinc-400 max-w-xs mx-auto">
                  Your limited archive order has been processed. Dispatch notice and tracking will be sent.
                </p>
                <button
                  onClick={() => {
                    setOrderComplete(false);
                    onClose();
                  }}
                  className="mt-4 px-6 py-2.5 rounded-lg bg-white text-zinc-950 font-mono text-xs font-bold hover:bg-zinc-200 transition cursor-pointer"
                >
                  RETURN TO SHOWROOM
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <p className="font-['Syne'] text-base text-zinc-400">
                  Your bag is currently empty
                </p>
                <p className="text-xs font-mono text-zinc-500 max-w-xs mx-auto">
                  Browse the virtual clothing rack and click "ADD TO BAG" to reserve pieces from Drop 04.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {items.map((item) => (
                  <div key={item.cartItemId} className="py-4 flex gap-4 items-center">
                    {/* Color Swatch Icon */}
                    <div
                      className="w-12 h-14 rounded-lg border border-zinc-700 flex-shrink-0 flex items-center justify-center relative overflow-hidden"
                      style={{ backgroundColor: item.color.hex }}
                    >
                      <span className="text-[9px] font-mono text-white/70 uppercase">
                        {item.category.slice(0, 3)}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-['Syne'] font-bold text-sm text-white truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-0.5">
                        <span>{item.color.name}</span>
                        <span>·</span>
                        <span>SIZE {item.size}</span>
                      </div>
                      <div className="text-sm font-bold font-mono text-white mt-1">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                      <button
                        onClick={() => {
                          soundEngine.playClick();
                          onUpdateQuantity(item.cartItemId, -1);
                        }}
                        className="p-1 hover:text-white text-zinc-400 transition cursor-pointer"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-mono font-bold w-5 text-center text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          soundEngine.playClick();
                          onUpdateQuantity(item.cartItemId, 1);
                        }}
                        className="p-1 hover:text-white text-zinc-400 transition cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        onRemoveItem(item.cartItemId);
                      }}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Checkout Calculation */}
          {!orderComplete && items.length > 0 && (
            <div className="p-6 border-t border-zinc-800 bg-zinc-950/90 space-y-3">
              {/* Promo code form */}
              <form onSubmit={applyPromo} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code (STREETWEAR10)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-white uppercase"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-white rounded-lg transition cursor-pointer"
                >
                  Apply
                </button>
              </form>
              {promoMessage && (
                <p className="text-[11px] font-mono text-amber-400">
                  {promoMessage}
                </p>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs font-mono pt-2 border-t border-zinc-800/80">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>VIP Drop Discount (10%)</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Shipping</span>
                  <span className="text-white">
                    {shipping === 0 ? 'FREE (OVER $150)' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-zinc-800">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full py-3 rounded-xl bg-white text-zinc-950 font-mono text-xs font-extrabold hover:bg-zinc-200 transition shadow-xl flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isCheckingOut ? (
                  <span>AUTHORIZING ARCHIVE TRANSACTION...</span>
                ) : (
                  <>
                    <span>CHECKOUT · {formatPrice(total)}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-zinc-500 pt-1">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>SECURE ENCRYPTED CHECKOUT · COMPLIMENTARY RETURNS</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
