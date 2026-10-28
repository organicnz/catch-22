'use client';

import { ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCartStore } from '@/lib/store/cart';
import { getStorageUrl } from '@/lib/supabase';
import { WishlistButton } from './WishlistButton';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    regular_price?: number | null;
    sale_price?: number | null;
    image_url: string | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const isOnSale = product.regular_price && product.regular_price > product.price;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_url,
      slug: product.slug,
    });
    setAdded(true);
    toast.success(`${product.name} added to cart`);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="group relative flex flex-col h-full bg-white border border-slate-100 rounded-4xl overflow-hidden shadow-sm hover:shadow-2xl hover:border-slate-200 transition-all duration-500"
    >
      {/* Sale Badge */}
      {isOnSale && (
        <div className="absolute top-4 left-4 z-30 bg-primary text-secondary text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-primary/20">
          Sale
        </div>
      )}

      {/* Wishlist — always visible on mobile, hover on desktop */}
      <div className="absolute top-4 right-4 z-20 sm:opacity-0 sm:translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-300">
        <WishlistButton product={product} />
      </div>

      {/* Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative h-48 xs:h-60 sm:h-64 overflow-hidden bg-slate-50 block"
        tabIndex={-1}
        aria-hidden="true"
      >
        {product.image_url ? (
          <Image
            src={getStorageUrl(product.image_url)}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="w-full h-full object-center object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 font-black uppercase tracking-widest text-[10px]">
            No Image
          </div>
        )}

        {/* Quick-add overlay — slides up on hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-10 p-3">
          <button
            type="button"
            onClick={handleQuickAdd}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-lg ${
              added
                ? 'bg-emerald-500 text-white'
                : 'bg-secondary text-white hover:bg-primary hover:text-secondary'
            }`}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart size={14} strokeWidth={3} />
            {added ? 'Added!' : 'Quick Add'}
          </button>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 sm:p-6 grow flex flex-col justify-between">
        <h3 className="text-xs sm:text-sm font-black text-secondary uppercase tracking-wider mb-3 line-clamp-2 leading-tight">
          <Link
            href={`/products/${product.slug}`}
            className="hover:text-primary-ink transition-colors duration-300"
          >
            {product.name}
          </Link>
        </h3>

        <div className="flex items-end justify-between gap-3 mt-auto">
          <div className="flex flex-col">
            {isOnSale && (
              <span className="text-[10px] text-slate-400 line-through font-medium leading-none mb-1">
                ${product.regular_price?.toFixed(2)}
              </span>
            )}
            <p className="text-xl sm:text-2xl font-black text-primary-ink leading-none tabular-nums">
              ${product.price.toFixed(2)}
            </p>
            {product.price >= 20 && (
              <div className="flex items-center gap-1 mt-1.5 text-[9px] font-bold text-slate-500">
                <span>or 4 × ${(product.price / 4).toFixed(2)}</span>
                <span className="font-black text-[#00a87a] bg-[#B2FCE4]/60 px-1 py-0.5 rounded text-[8px] uppercase tracking-tight">
                  afterpay
                </span>
              </div>
            )}
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="text-[9px] sm:text-[10px] font-black text-secondary uppercase tracking-widest hover:text-primary-ink transition-colors duration-300 shrink-0"
          >
            View →
          </Link>
        </div>
      </div>

      {/* Lime accent line — grows on hover */}
      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary group-hover:w-full transition-all duration-700 ease-out" />
    </motion.div>
  );
}
