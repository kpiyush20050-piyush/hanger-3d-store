import React from 'react';
import { ProductCategory } from '../types/product';
import { Volume2, VolumeX, ShoppingBag, PlusCircle, Sparkles } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface HeaderProps {
  currentCategory: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  currency: string;
  onChangeCurrency: (curr: string) => void;
}

const CATEGORIES: { label: string; value: ProductCategory }[] = [
  { label: 'ALL PIECES', value: 'ALL' },
  { label: 'TEES', value: 'TEES' },
  { label: 'HOODIES', value: 'HOODIES' },
  { label: 'TANKS', value: 'TANKS' },
  { label: 'OUTERWEAR', value: 'OUTERWEAR' },
];

export const Header: React.FC<HeaderProps> = ({
  currentCategory,
  onSelectCategory,
  cartCount,
  onOpenCart,
  onOpenAdmin,
  isMuted,
  onToggleMute,
  currency,
  onChangeCurrency,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-8 py-4 pointer-events-none">
      {/* Brand Logo & Edition */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-['Syne'] font-extrabold text-lg sm:text-xl tracking-tight text-white">
              AETHEL <span className="text-zinc-500 font-normal">/</span> STUDIO
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              DROP 04
            </span>
          </div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase hidden sm:block">
            VIRTUAL STREETWEAR RAIL · ARCHIVE EDITION
          </span>
        </div>
      </div>

      {/* Category Pills (Center) */}
      <nav className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md shadow-2xl pointer-events-auto">
        {CATEGORIES.map((cat) => {
          const isActive = currentCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => {
                soundEngine.playClick();
                onSelectCategory(cat.value);
              }}
              className={`px-3 py-1 rounded-full text-xs font-mono transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white text-zinc-950 font-semibold shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </nav>

      {/* Action Utilities (Right) */}
      <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
        {/* Currency Switcher */}
        <select
          value={currency}
          aria-label="Select Currency"
          onChange={(e) => {
            soundEngine.playClick();
            onChangeCurrency(e.target.value);
          }}
          className="bg-zinc-950/80 border border-zinc-800 text-zinc-300 text-xs font-mono px-2 py-1.5 rounded-md hover:border-zinc-700 cursor-pointer focus:outline-none"
        >
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="JPY">JPY (¥)</option>
        </select>

        {/* Audio Toggle */}
        <button
          onClick={() => {
            onToggleMute();
            soundEngine.playClick();
          }}
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          className="p-2 rounded-md bg-zinc-950/80 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition cursor-pointer"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {/* Admin Dashboard Trigger */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenAdmin();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900/90 border border-zinc-700/80 text-zinc-200 hover:text-white hover:bg-zinc-800 hover:border-zinc-500 transition text-xs font-mono font-medium shadow-sm cursor-pointer"
        >
          <PlusCircle size={14} className="text-emerald-400" />
          <span className="hidden sm:inline">ADD PRODUCT</span>
          <span className="sm:hidden">ADMIN</span>
        </button>

        {/* Shopping Bag Trigger */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenCart();
          }}
          className="relative flex items-center gap-2 px-3 py-1.5 rounded-md bg-white text-zinc-950 hover:bg-zinc-200 font-mono text-xs font-semibold transition shadow-md cursor-pointer"
        >
          <ShoppingBag size={15} />
          <span className="hidden sm:inline">BAG</span>
          <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-zinc-900 text-white text-[11px] font-bold">
            {cartCount}
          </span>
        </button>
      </div>
    </header>
  );
};
