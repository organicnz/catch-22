'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from './ProductCard';

interface ProductSliderProps {
  products: any[];
}

export function ProductSlider({ products }: ProductSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      checkScroll();
    }
    return () => {
      el?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="relative group/slider">
      {/* Navigation Arrows */}
      <div className="absolute top-1/2 -left-4 md:-left-8 -translate-y-1/2 z-20 transition-all duration-500 opacity-0 group-hover/slider:opacity-100 hidden md:block">
        <button
          onClick={() => scroll('left')}
          disabled={!showLeftArrow}
          className={`p-4 rounded-full bg-white border border-slate-100 shadow-xl transition-all duration-300 ${
            showLeftArrow ? 'hover:bg-primary hover:scale-110 text-secondary' : 'opacity-0 cursor-default'
          }`}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="absolute top-1/2 -right-4 md:-right-8 -translate-y-1/2 z-20 transition-all duration-500 opacity-0 group-hover/slider:opacity-100 hidden md:block">
        <button
          onClick={() => scroll('right')}
          disabled={!showRightArrow}
          className={`p-4 rounded-full bg-white border border-slate-100 shadow-xl transition-all duration-300 ${
            showRightArrow ? 'hover:bg-primary hover:scale-110 text-secondary' : 'opacity-0 cursor-default'
          }`}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Slider Container */}
      <div
        ref={scrollRef}
        className="flex gap-8 overflow-x-auto pb-12 pt-4 hide-scrollbar snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div key={product.id} className="min-w-[85%] sm:min-w-[45%] lg:min-w-[23%] snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
