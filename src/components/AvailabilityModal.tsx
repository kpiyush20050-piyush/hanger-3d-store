import React from 'react';
import { Product } from '../types/product';
import { X, MapPin, Check, AlertCircle, ShieldAlert } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

const FLAGSHIP_LOCATIONS = [
  { city: 'Tokyo (Harajuku / Shibuya)', stock: 'IN STOCK', units: '5 units' },
  { city: 'New York (SoHo Flagship)', stock: 'LOW STOCK', units: '2 units' },
  { city: 'London (Shoreditch Studio)', stock: 'IN STOCK', units: '4 units' },
  { city: 'Paris (Le Marais Archive)', stock: 'SOLD OUT', units: 'Waitlist' },
  { city: 'Seoul (Seongsu Showroom)', stock: 'IN STOCK', units: '6 units' },
];

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <h3 className="font-['Syne'] font-bold text-lg text-white">
              AVAILABILITY & TECHNICAL SPECS
            </h3>
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

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Product Summary */}
          <div>
            <span className="text-[11px] font-mono text-zinc-400 uppercase">
              {product.category} · DROP 04
            </span>
            <h4 className="font-['Syne'] font-extrabold text-xl text-white">
              {product.name}
            </h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Technical Specs Grid */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-zinc-500 block">WEIGHT & GSM</span>
              <span className="text-white font-bold">{product.gsm}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">CUT & SILHOUETTE</span>
              <span className="text-white font-bold">{product.fit}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">MATERIAL COMPOSITION</span>
              <span className="text-white font-bold">{product.composition}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">CARE INSTRUCTIONS</span>
              <span className="text-white font-bold">Cold wash, Hang dry</span>
            </div>
          </div>

          {/* Worldwide Flagship Store Stock */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={15} className="text-emerald-400" />
              <h5 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                WORLDWIDE FLAGSHIP BOUTIQUES
              </h5>
            </div>

            <div className="space-y-2">
              {FLAGSHIP_LOCATIONS.map((loc) => {
                const isAvailable = loc.stock !== 'SOLD OUT';
                const isLow = loc.stock === 'LOW STOCK';

                return (
                  <div
                    key={loc.city}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 text-xs font-mono"
                  >
                    <span className="text-zinc-300">{loc.city}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">{loc.units}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isLow
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            : isAvailable
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                        }`}
                      >
                        {loc.stock}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-lg bg-white text-zinc-950 font-mono text-xs font-bold hover:bg-zinc-200 transition cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
