'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { useState, useEffect } from 'react';

export function Header() {
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const totalItems = useCartStore((state) => state.totalItems());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-extrabold text-slate-900 tracking-tight">
              CATCH-22
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/products" className="text-slate-600 hover:text-slate-900 font-medium">
              Shop Gear
            </Link>
            <Link href="/about" className="text-slate-600 hover:text-slate-900 font-medium">
              About
            </Link>
          </nav>

          {/* Cart & Mobile Toggle */}
          <div className="flex items-center space-x-4">
            <Link href="/cart" className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors">
              <ShoppingCart size={24} />
              {isMounted && totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-indigo-600 rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>
            
            <button 
              className="md:hidden p-2 text-slate-600 hover:text-slate-900"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/products" 
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-900 hover:bg-slate-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Shop Gear
            </Link>
            <Link 
              href="/about" 
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-900 hover:bg-slate-50"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
