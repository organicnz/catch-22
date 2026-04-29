'use client';

import { useState } from 'react';
import { useCartStore } from '@/lib/store/cart';
import { ShoppingCart, ChevronDown } from 'lucide-react';

interface Variation {
  id: number;
  price: number;
  attributes: Record<string, string>;
  stock_status: string;
}

interface AddToCartButtonProps {
  product: {
    id: number;
    name: string;
    price: number;
    image_url: string | null;
    slug: string;
    stock_status: string;
  };
  variations?: Variation[];
}

export function AddToCartButton({ product, variations = [] }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [isAdded, setIsAdded] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(
    variations.length > 0 ? variations[0] : null
  );

  const handleAddToCart = () => {
    addItem({
      id: selectedVariation ? selectedVariation.id : product.id,
      name: selectedVariation 
        ? `${product.name} - ${Object.values(selectedVariation.attributes).join(', ')}`
        : product.name,
      price: selectedVariation ? selectedVariation.price : product.price,
      quantity: 1,
      image_url: product.image_url,
      slug: product.slug,
    });
    
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const isOutOfStock = selectedVariation 
    ? selectedVariation.stock_status !== 'instock' 
    : product.stock_status !== 'instock';
    
  const displayPrice = selectedVariation ? selectedVariation.price : product.price;

  return (
    <div className="w-full space-y-4">
      {variations.length > 0 && (
        <div className="relative">
          <label htmlFor="variation" className="block text-sm font-medium text-slate-700 mb-1">
            Select Option
          </label>
          <div className="relative">
            <select
              id="variation"
              value={selectedVariation?.id || ''}
              onChange={(e) => {
                const v = variations.find(v => v.id === parseInt(e.target.value));
                if (v) setSelectedVariation(v);
              }}
              className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 py-3 px-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-medium"
            >
              {variations.map((v) => (
                <option key={v.id} value={v.id}>
                  {Object.values(v.attributes).join(' / ')} - ${v.price.toFixed(2)}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      )}
      
      {variations.length > 0 && (
         <div className="mt-4 mb-6">
            <p className="text-3xl text-slate-900 font-bold">${displayPrice.toFixed(2)}</p>
         </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={`w-full border border-transparent rounded-lg py-4 px-8 flex items-center justify-center text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
          isOutOfStock 
            ? 'bg-slate-400 cursor-not-allowed' 
            : isAdded 
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
        }`}
      >
        <ShoppingCart className="mr-2" size={20} />
        {isOutOfStock ? 'Out of stock' : isAdded ? 'Added to Cart!' : 'Add to bag'}
      </button>
    </div>
  );
}