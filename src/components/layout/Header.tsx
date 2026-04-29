'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, X, User, Search } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function Header() {
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const totalItems = useCartStore((state) => state.totalItems());
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center mr-4">
            <Link href="/" className="text-2xl font-extrabold text-slate-900 tracking-tight">
              CATCH-22
            </Link>
          </div>

          {/* Desktop Navigation & Search */}
          <div className="hidden md:flex flex-1 items-center justify-between ml-8">
            <nav className="flex space-x-8">
              <Link href="/products" className="text-slate-600 hover:text-slate-900 font-medium">
                Shop Gear
              </Link>
              <Link href="/blog" className="text-slate-600 hover:text-slate-900 font-medium">
                Blog
              </Link>
              <Link href="/about" className="text-slate-600 hover:text-slate-900 font-medium">
                About
              </Link>
              <Link href="/contact" className="text-slate-600 hover:text-slate-900 font-medium">
                Contact
              </Link>
            </nav>

            <form onSubmit={handleSearch} className="relative ml-8 max-w-xs w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gear..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            </form>
          </div>

          {/* Cart, Account & Mobile Toggle */}
          <div className="flex items-center space-x-2 md:space-x-4 ml-4">
            <Link href="/account" className="p-2 text-slate-600 hover:text-slate-900 transition-colors">
              <User size={24} />
            </Link>
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
          <div className="px-4 py-4">
            <form onSubmit={handleSearch} className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gear..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
            </form>
            <div className="space-y-1">
              <Link 
                href="/products" 
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-900 hover:bg-slate-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Shop Gear
              </Link>
              <Link 
                href="/blog" 
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-900 hover:bg-slate-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
              <Link 
                href="/about" 
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-900 hover:bg-slate-50"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-900 hover:bg-slate-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}