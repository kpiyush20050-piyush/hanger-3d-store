/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, ProductCategory, CartItem } from './types/product';
import { DEFAULT_PRODUCTS } from './data/defaultProducts';
import { ClothesRack3D } from './components/ClothesRack3D';
import { Header } from './components/Header';
import { ProductDock } from './components/ProductDock';
import { AdminModal } from './components/AdminModal';
import { CartDrawer } from './components/CartDrawer';
import { AvailabilityModal } from './components/AvailabilityModal';
import { soundEngine } from './utils/audio';

const STORAGE_KEY_PRODUCTS = 'aethel_products_v1';
const STORAGE_KEY_CART = 'aethel_cart_v1';
const STORAGE_KEY_MUTE = 'aethel_sound_mute';

export default function App() {
  // 1. Products state loaded dynamically from localStorage
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PRODUCTS;
  });

  // Save products to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } catch {
      // Ignore storage quota error
    }
  }, [products]);

  // 2. Active Category filter
  const [currentCategory, setCurrentCategory] = useState<ProductCategory>('ALL');

  // Filtered products on the rack
  const filteredProducts = useMemo(() => {
    if (currentCategory === 'ALL') return products;
    return products.filter((p) => p.category === currentCategory);
  }, [products, currentCategory]);

  // 3. Carousel active index
  const [activeIndex, setActiveIndex] = useState(0);

  // Guard activeIndex within filtered bounds
  useEffect(() => {
    if (activeIndex >= filteredProducts.length) {
      setActiveIndex(Math.max(0, filteredProducts.length - 1));
    }
  }, [filteredProducts.length, activeIndex]);

  const currentProduct: Product | undefined = filteredProducts[activeIndex] || filteredProducts[0];

  // 4. Garment inspection states
  const [isFlippedBack, setIsFlippedBack] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('L');
  const [isInspectMode, setIsInspectMode] = useState(false);

  // Reset flip and size when changing product
  useEffect(() => {
    setIsFlippedBack(false);
    setSelectedColorIndex(0);
    if (currentProduct?.sizes && currentProduct.sizes.length > 0) {
      setSelectedSize(currentProduct.sizes[1] || currentProduct.sizes[0]);
    }
  }, [currentProduct?.id]);

  // 5. Shopping Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cartItems));
    } catch {
      // Ignore
    }
  }, [cartItems]);

  // 6. UI Modals
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);

  // 7. Currency & Audio
  const [currency, setCurrency] = useState('USD');
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_MUTE) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    soundEngine.setMuted(isMuted);
    try {
      localStorage.setItem(STORAGE_KEY_MUTE, String(isMuted));
    } catch {
      // Ignore
    }
  }, [isMuted]);

  // Cart operations
  const handleAddToCart = useCallback(() => {
    if (!currentProduct) return;
    const currentColor =
      currentProduct.colors[selectedColorIndex] ||
      currentProduct.colors[0] || { name: 'Black', hex: '#141416' };

    const newItem: CartItem = {
      cartItemId: `${currentProduct.id}-${currentColor.name}-${selectedSize}-${Date.now()}`,
      productId: currentProduct.id,
      name: currentProduct.name,
      price: currentProduct.price,
      color: currentColor,
      size: selectedSize,
      quantity: 1,
      imageUrl: currentProduct.frontImageUrl,
      category: currentProduct.category,
    };

    setCartItems((prev) => {
      // Check if duplicate of exact product, color, and size
      const existing = prev.find(
        (it) =>
          it.productId === newItem.productId &&
          it.color.name === newItem.color.name &&
          it.size === newItem.size
      );
      if (existing) {
        return prev.map((it) =>
          it.cartItemId === existing.cartItemId
            ? { ...it, quantity: it.quantity + 1 }
            : it
        );
      }
      return [...prev, newItem];
    });
  }, [currentProduct, selectedColorIndex, selectedSize]);

  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((it) => {
          if (it.cartItemId === cartItemId) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((it) => it.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Admin Operations
  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    // If category is filtered, reset to ALL so new piece is immediately visible
    if (currentCategory !== 'ALL' && currentCategory !== newProd.category) {
      setCurrentCategory('ALL');
    }
    setActiveIndex(0);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleResetDefaults = () => {
    setProducts(DEFAULT_PRODUCTS);
    localStorage.removeItem(STORAGE_KEY_PRODUCTS);
    setActiveIndex(0);
  };

  // Keyboard Navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Do not capture if typing in input or modal open
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(0, prev - 1));
        soundEngine.playHangerClink(0.35);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(filteredProducts.length - 1, prev + 1));
        soundEngine.playHangerClink(0.35);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsFlippedBack((prev) => !prev);
        soundEngine.playFlip();
      } else if (e.key === 'a' || e.key === 'A') {
        setIsAdminOpen((prev) => !prev);
      } else if (e.key === 'b' || e.key === 'B') {
        setIsCartOpen((prev) => !prev);
      } else if (e.key === 'i' || e.key === 'I') {
        setIsInspectMode((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filteredProducts.length]);

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden bg-[#0b0c0e] font-['Plus_Jakarta_Sans',sans-serif] text-zinc-100 select-none flex flex-col">
      {/* Top Header Navigation */}
      <Header
        currentCategory={currentCategory}
        onSelectCategory={(cat) => {
          setCurrentCategory(cat);
          setActiveIndex(0);
        }}
        cartCount={cartItems.reduce((acc, it) => acc + it.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        currency={currency}
        onChangeCurrency={setCurrency}
      />

      {/* Main 3D Clothing Rack Showroom Viewport */}
      <main className="w-full flex-1 relative min-h-[400px]">
        {filteredProducts.length > 0 ? (
          <ClothesRack3D
            products={filteredProducts}
            activeIndex={activeIndex}
            onSelectIndex={setActiveIndex}
            isFlippedBack={isFlippedBack}
            onToggleFlip={() => setIsFlippedBack(!isFlippedBack)}
            selectedColorIndex={selectedColorIndex}
            isInspectMode={isInspectMode}
            onToggleInspect={() => setIsInspectMode(!isInspectMode)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <p className="font-['Syne'] text-xl text-zinc-400">
              No garments found in this category
            </p>
            <button
              onClick={() => setCurrentCategory('ALL')}
              className="mt-4 px-4 py-2 rounded-lg bg-white text-zinc-950 font-mono text-xs font-bold cursor-pointer"
            >
              SHOW ALL PIECES
            </button>
          </div>
        )}
      </main>

      {/* Bottom Collapsible Interactive Product Dock */}
      {currentProduct && filteredProducts.length > 0 && (
        <ProductDock
          product={currentProduct}
          currentIndex={activeIndex}
          totalProducts={filteredProducts.length}
          onPrev={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
          onNext={() =>
            setActiveIndex((prev) => Math.min(filteredProducts.length - 1, prev + 1))
          }
          isFlippedBack={isFlippedBack}
          onToggleFlip={() => setIsFlippedBack(!isFlippedBack)}
          selectedColorIndex={selectedColorIndex}
          onSelectColor={setSelectedColorIndex}
          selectedSize={selectedSize}
          onSelectSize={setSelectedSize}
          onAddToCart={handleAddToCart}
          onOpenAvailability={() => setIsAvailabilityOpen(true)}
          isInspectMode={isInspectMode}
          onToggleInspect={() => setIsInspectMode(!isInspectMode)}
          currency={currency}
        />
      )}

      {/* Admin Dashboard Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        onAddProduct={handleAddProduct}
        onDeleteProduct={handleDeleteProduct}
        onResetDefaults={handleResetDefaults}
      />

      {/* Shopping Bag Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        currency={currency}
      />

      {/* Availability & Technical Specs Modal */}
      {currentProduct && (
        <AvailabilityModal
          isOpen={isAvailabilityOpen}
          onClose={() => setIsAvailabilityOpen(false)}
          product={currentProduct}
        />
      )}
    </div>
  );
}
