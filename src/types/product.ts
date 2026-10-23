export type ProductCategory = 'ALL' | 'TEES' | 'HOODIES' | 'TANKS' | 'OUTERWEAR';

export interface ProductColor {
  name: string;
  hex: string;
  secondaryHex?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'TEES' | 'HOODIES' | 'TANKS' | 'OUTERWEAR';
  frontImageUrl: string;
  backImageUrl: string;
  colors: ProductColor[];
  selectedColorIndex?: number;
  sizes: string[];
  description: string;
  fit: string;
  gsm: string;
  composition: string;
  stockCount: number;
  badge?: string;
  frontGraphicType?: 'graphic' | 'minimal' | 'typography' | 'custom';
  backGraphicType?: 'oversized' | 'typography' | 'barcode' | 'custom';
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  price: number;
  color: ProductColor;
  size: string;
  quantity: number;
  imageUrl: string;
  category: string;
}
