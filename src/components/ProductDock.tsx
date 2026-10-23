import React, { useState } from 'react';
import { Product } from '../types/product';
import {
  RotateCcw,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface ProductDockProps {
  product: Product;
  currentIndex: number;
  totalProducts: number;
  onPrev: () => void;
  onNext: () => void;
  isFlippedBack: boolean;
  onToggleFlip: () => void;
  selectedColorIndex: number;
  onSelectColor: (index: number) => void;
  selectedSize: string;
  onSelectSize: (size: string) => void;
  onAddToCart: () => void;
  onOpenAvailability: () => void;
  isInspectMode: boolean;
  onToggleInspect: () => void;
  currency: string;
}

export const ProductDock: React.FC<ProductDockProps> = ({
  product,
  currentIndex,
  totalProducts,
  onPrev,
  onNext,
  isFlippedBack,
  onToggleFlip,
  selectedColorIndex,
  onSelectColor,
  selectedSize,
  onSelectSize,
  onAddToCart,
  onOpenAvailability,
  isInspectMode,
  onToggleInspect,
  currency,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Currency Formatter
  const formatPrice = (usd: number) => {
    switch (currency) {
      case 'EUR':
        return `€${Math.round(usd * 0.92)}`;
      case 'GBP':
        return `£${Math.round(usd * 0.79)}`;
      case 'JPY':
        return `¥${Math.round(usd * 152).toLocaleString()}`;
      default:
        return `$${usd}`;
    }
  };

  const handleAdd = () => {
    soundEngine.playAddToCart();
    setAddedAnimation(true);
    onAddToCart();
    setTimeout(() => setAddedAnimation(false), 900);
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-4xl pointer-events-none transition-all duration-300">
      {/* Collapse / Expand Cinema Mode Toggle */}
      <div className="flex justify-center mb-1.5 pointer-events-auto">
        <button
          onClick={() => {
            soundEngine.playClick();
            setIsCollapsed(!isCollapsed);
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950/80 border border-zinc-800 text-[11px] font-mono text-zinc-400 hover:text-white hover:border-zinc-700 backdrop-blur-md transition cursor-pointer shadow-lg"
        >
          {isCollapsed ? (
            <>
              <ChevronUp size={13} />
              <span>SHOW PRODUCT CONTROLS</span>
            </>
          ) : (
            <>
              <ChevronDown size={13} />
              <span>HIDE DOCK (CINEMA MODE)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Glassmorphic Dock */}
      <div
        className={`pointer-events-auto bg-zinc-950/92 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
          isCollapsed ? 'opacity-0 translate-y-12 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Column 1: Product Identity & Badges */}
          <div className="lg:col-span-5 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                {product.category}
              </span>
              {product.badge && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold">
                  {product.badge}
                </span>
              )}
              <span className="text-[11px] font-mono text-zinc-500">
                {product.gsm} · {product.fit}
              </span>
            </div>

            <h2 className="font-['Syne'] font-extrabold text-xl sm:text-2xl tracking-tight text-white line-clamp-1">
              {product.name}
            </h2>

            <div className="flex items-center gap-3">
              <span className="text-xl font-bold font-mono text-white">
                {formatPrice(product.price)}
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                {product.stockCount} IN STOCK
              </span>
            </div>
          </div>

          {/* Column 2: Color Swatches & Size Selector */}
          <div className="lg:col-span-4 flex flex-col gap-2.5">
            {/* Color Swatches */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400 uppercase w-14">
                Color:
              </span>
              <div className="flex items-center gap-2">
                {product.colors.map((color, idx) => {
                  const isSelected = idx === selectedColorIndex;
                  return (
                    <button
                      key={color.name}
                      onClick={() => {
                        soundEngine.playClick();
                        onSelectColor(idx);
                      }}
                      title={color.name}
                      style={{ backgroundColor: color.hex }}
                      className={`relative w-7 h-7 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-zinc-700 hover:border-zinc-400 opacity-80 hover:opacity-100'
                      }`}
                    >
                      {isSelected && (
                        <Check
                          size={12}
                          className={
                            color.hex.toLowerCase() === '#ffffff' ||
                            color.hex.toLowerCase() === '#f0f0f2' ||
                            color.hex.toLowerCase() === '#e8e8ea'
                              ? 'text-black'
                              : 'text-white'
                          }
                        />
                      )}
                    </button>
                  );
                })}
                <span className="text-xs font-mono text-zinc-400 ml-1">
                  {product.colors[selectedColorIndex]?.name}
                </span>
              </div>
            </div>

            {/* Sizes */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400 uppercase w-14">
                Size:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {product.sizes.map((size) => {
                  const isSelected = size === selectedSize;
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        soundEngine.playClick();
                        onSelectSize(size);
                      }}
                      className={`min-w-8 h-7 px-2 rounded text-xs font-mono font-medium transition cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'bg-white text-zinc-950 font-bold'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 3: Interactive Actions (Flip, Inspect, Add to Bag) */}
          <div className="lg:col-span-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {/* Front / Back 180° Flip Toggle */}
              <button
                onClick={() => {
                  soundEngine.playFlip();
                  onToggleFlip();
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-mono transition cursor-pointer ${
                  isFlippedBack
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500'
                }`}
              >
                <RotateCcw
                  size={14}
                  className={`transition-transform duration-500 ${
                    isFlippedBack ? 'rotate-180 text-rose-400' : ''
                  }`}
                />
                <span>{isFlippedBack ? 'BACK VIEW' : 'FRONT VIEW'}</span>
              </button>

              {/* 360 Free Inspect Toggle */}
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onToggleInspect();
                }}
                title={isInspectMode ? 'Exit 360 Inspect' : 'Enter 360 Inspect'}
                className={`p-2 rounded-lg border transition cursor-pointer ${
                  isInspectMode
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                }`}
              >
                <Eye size={15} />
              </button>

              {/* Specs & Availability Modal Trigger */}
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onOpenAvailability();
                }}
                title="View Technical Specs & Store Stock"
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition cursor-pointer"
              >
                <Info size={15} />
              </button>
            </div>

            {/* Prominent ADD TO BAG Button */}
            <button
              onClick={handleAdd}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-lg ${
                addedAnimation
                  ? 'bg-emerald-500 text-zinc-950 scale-95'
                  : 'bg-white hover:bg-zinc-200 text-zinc-950'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check size={16} />
                  <span>ADDED TO BAG!</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={15} />
                  <span>ADD TO BAG · {formatPrice(product.price)}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Rail Slider Control Bar with Prev / Next */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800/80">
          <button
            onClick={() => {
              soundEngine.playClick();
              onPrev();
            }}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">PREVIOUS PIECE</span>
          </button>

          {/* Interactive Progress Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalProducts }).map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-6 bg-white'
                    : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onNext();
            }}
            disabled={currentIndex === totalProducts - 1}
            className="flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          >
            <span className="hidden sm:inline">NEXT PIECE</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
