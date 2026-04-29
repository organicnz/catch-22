'use client';

import { useState } from 'react';
import { useCartStore } from '@/lib/store/cart';
import { ShoppingCart } from 'lucide-react';

interface AddToCartButtonProps {
  product: {
    id: number;
    name: string;
    price: number;
    image_url: string | null;
    slug: string;
    stock_status: string;
  };
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_url,
      slug: product.slug,
    });
    
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const isOutOfStock = product.stock_status !== 'instock';

  return (
    <button
      onClick={handleAddToCart}
      disabled={isOutOfStock}
      className={`w-full border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
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
  );
}