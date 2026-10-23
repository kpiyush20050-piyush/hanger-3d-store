import React, { useState } from 'react';
import { Product, ProductCategory } from '../types/product';
import {
  X,
  Plus,
  Trash2,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Settings,
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (newProduct: Product) => void;
  onDeleteProduct: (id: string) => void;
  onResetDefaults: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddProduct,
  onDeleteProduct,
  onResetDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('add');

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(120);
  const [category, setCategory] = useState<'TEES' | 'HOODIES' | 'TANKS' | 'OUTERWEAR'>('TEES');
  const [frontImageUrl, setFrontImageUrl] = useState('');
  const [backImageUrl, setBackImageUrl] = useState('');
  const [colorName, setColorName] = useState('Pitch Black');
  const [colorHex, setColorHex] = useState('#141416');
  const [fit, setFit] = useState('Oversized Boxy Fit');
  const [gsm, setGsm] = useState('360 GSM');
  const [description, setDescription] = useState(
    'Heavyweight custom streetwear silhouette with reinforced ribbing and drop shoulders.'
  );
  const [stockCount, setStockCount] = useState<number>(10);
  const [badge, setBadge] = useState('STUDIO DROP');

  if (!isOpen) return null;

  // Handle local image file upload converting to DataURL
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (type === 'front') {
          setFrontImageUrl(result);
        } else {
          setBackImageUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: name.toUpperCase().trim(),
      price: Number(price) || 90,
      category,
      frontImageUrl: frontImageUrl.trim(),
      backImageUrl: backImageUrl.trim(),
      colors: [
        { name: colorName, hex: colorHex },
        { name: 'Vintage Slate', hex: '#2c2e33' },
      ],
      selectedColorIndex: 0,
      sizes: ['S', 'M', 'L', 'XL'],
      description: description.trim(),
      fit: fit.trim(),
      gsm: gsm.trim(),
      composition: '100% Heavyweight Cotton',
      stockCount: Number(stockCount) || 8,
      badge: badge.trim() || undefined,
    };

    onAddProduct(newProduct);
    soundEngine.playAddToCart();

    // Reset form
    setName('');
    setFrontImageUrl('');
    setBackImageUrl('');
    onClose();
  };

  // Quick preset template loader
  const loadPreset = (presetName: string) => {
    soundEngine.playClick();
    if (presetName === 'Cyber Tee') {
      setName('CYBERNETIC ACID TEE');
      setPrice(115);
      setCategory('TEES');
      setColorName('Acid Washed Grey');
      setColorHex('#26282d');
      setGsm('340 GSM');
      setFit('Skate Boxy Fit');
      setBadge('LIMITED');
    } else if (presetName === 'Gothic Hoodie') {
      setName('GOTHIC RELIC HEAVY HOODIE');
      setPrice(210);
      setCategory('HOODIES');
      setColorName('Deep Obsidian');
      setColorHex('#121215');
      setGsm('540 GSM');
      setFit('Double-Layered Hood');
      setBadge('GRAIL PIECE');
    } else if (presetName === 'Tactical Vest') {
      setName('MODULAR UTILITY TANK');
      setPrice(85);
      setCategory('TANKS');
      setColorName('Faded Olive');
      setColorHex('#383c34');
      setGsm('300 GSM');
      setFit('Raw Cut Relaxed');
      setBadge('ARCHIVE');
    } else if (presetName === 'Shell Jacket') {
      setName('KINETIC NYLON SHELL');
      setPrice(320);
      setCategory('OUTERWEAR');
      setColorName('Stealth Carbon');
      setColorHex('#18191c');
      setGsm('650 GSM Equivalent');
      setFit('Technical Structural');
      setBadge('DROP EXCLUSIVE');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-emerald-400" />
            <h3 className="font-['Syne'] font-bold text-lg text-white">
              STUDIO ADMIN DASHBOARD
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
              LOCAL STORAGE SYNC
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

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800 px-6 bg-zinc-950">
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('add');
            }}
            className={`py-3 px-4 font-mono text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'add'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Plus size={14} />
            ADD NEW PRODUCT
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('manage');
            }}
            className={`py-3 px-4 font-mono text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'manage'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers size={14} />
            MANAGE RACK ({products.length} ITEMS)
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'add' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Presets Row */}
              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 mb-2">
                  <Sparkles size={13} className="text-amber-400" />
                  <span>FAST FILL PRESET:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Cyber Tee', 'Gothic Hoodie', 'Tactical Vest', 'Shell Jacket'].map(
                    (preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => loadPreset(preset)}
                        className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer"
                      >
                        + {preset}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  PRODUCT NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TOKYO DISTRICT OVERSIZED TEE"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white transition"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    PRICE (USD $) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    CATEGORY *
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(
                        e.target.value as 'TEES' | 'HOODIES' | 'TANKS' | 'OUTERWEAR'
                      )
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white transition font-mono"
                  >
                    <option value="TEES">T-Shirts (TEES)</option>
                    <option value="HOODIES">Hoodies (HOODIES)</option>
                    <option value="TANKS">Tank Tops (TANKS)</option>
                    <option value="OUTERWEAR">Outerwear / Jackets</option>
                  </select>
                </div>
              </div>

              {/* Front Image URL */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-zinc-400">
                    FRONT IMAGE / GRAPHIC URL
                  </label>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Optional URL or upload image
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://... or leave blank for procedural brutalist print"
                    value={frontImageUrl}
                    onChange={(e) => setFrontImageUrl(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition"
                  />
                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 cursor-pointer transition">
                    <Upload size={13} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'front')}
                    />
                  </label>
                </div>
              </div>

              {/* Back Image URL */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-zinc-400">
                    BACK IMAGE / GRAPHIC URL
                  </label>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Optional URL or upload image
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://... or leave blank for procedural oversized back print"
                    value={backImageUrl}
                    onChange={(e) => setBackImageUrl(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition"
                  />
                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 cursor-pointer transition">
                    <Upload size={13} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'back')}
                    />
                  </label>
                </div>
              </div>

              {/* Garment Color & Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    PRIMARY COLOR HEX
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-9 h-9 rounded bg-transparent border border-zinc-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    COLOR NAME
                  </label>
                  <input
                    type="text"
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    FABRIC GSM
                  </label>
                  <input
                    type="text"
                    value={gsm}
                    onChange={(e) => setGsm(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Fit & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    GARMENT FIT
                  </label>
                  <input
                    type="text"
                    value={fit}
                    onChange={(e) => setFit(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    EDITION BADGE (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-white text-zinc-950 font-mono text-xs font-bold hover:bg-zinc-200 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>PUBLISH & HANG ON 3D RACK</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-mono text-zinc-400">
                  CURRENTLY HANGING ({products.length} PRODUCTS)
                </span>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onResetDefaults();
                  }}
                  className="flex items-center gap-1.5 text-xs font-mono text-amber-400 hover:text-amber-300 transition cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>RESTORE ORIGINAL CATALOG</span>
                </button>
              </div>

              <div className="divide-y divide-zinc-800/80">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full border border-zinc-700"
                        style={{ backgroundColor: p.colors[0]?.hex || '#141416' }}
                      />
                      <div>
                        <h4 className="font-['Syne'] font-bold text-sm text-white">
                          {p.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                          <span>${p.price}</span>
                          <span>·</span>
                          <span>{p.category}</span>
                          <span>·</span>
                          <span>{p.gsm}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        onDeleteProduct(p.id);
                      }}
                      title="Remove product"
                      className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 transition cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
