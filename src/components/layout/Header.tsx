'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Menu, X, User, Search, LogOut, ChevronDown, Heart } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { useWishlistStore } from '@/lib/store/wishlist';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export function Header() {
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [categories, setCategories] = useState<{name: string, slug: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const totalItems = useCartStore((state) => state.totalItems());
  const wishlistItems = useWishlistStore((state) => state.items.length);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    
    // Fetch categories
    supabase.from('categories').select('name, slug').order('name').then(({ data }) => {
      if (data) setCategories(data);
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center mr-4">
            <Link href="/" className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="CATCH-22" 
                width={220} 
                height={138} 
                className="h-14 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation & Search */}
          <div className="hidden md:flex flex-1 items-center justify-between ml-8">
            <nav className="flex space-x-8">
              <div className="relative group">
                <button 
                  className="flex items-center gap-1 text-secondary hover:text-primary font-bold uppercase tracking-wider text-sm transition-colors py-8"
                  onMouseEnter={() => setIsShopOpen(true)}
                >
                  Shop Gear <ChevronDown size={14} strokeWidth={3} />
                </button>
                
                {/* Desktop Dropdown */}
                <div 
                  className={`absolute top-full left-0 w-56 bg-white shadow-xl border border-slate-100 rounded-b-2xl py-4 transition-all duration-200 ${isShopOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}
                  onMouseLeave={() => setIsShopOpen(false)}
                >
                  <Link href="/products" className="block px-6 py-2 text-xs font-black text-secondary uppercase tracking-widest hover:text-primary hover:bg-slate-50 transition-colors">
                    All Products
                  </Link>
                  {categories.map((cat) => (
                    <Link 
                      key={cat.slug} 
                      href={`/products?category=${cat.slug}`}
                      className="block px-6 py-2 text-xs font-black text-secondary uppercase tracking-widest hover:text-primary hover:bg-slate-50 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
              <Link href="/blog" className="text-secondary hover:text-primary font-bold uppercase tracking-wider text-sm transition-colors py-8">
                Logbook
              </Link>
              <Link href="/about-us" className="text-secondary hover:text-primary font-bold uppercase tracking-wider text-sm transition-colors py-8">
                About
              </Link>
              <Link href="/contact" className="text-secondary hover:text-primary font-bold uppercase tracking-wider text-sm transition-colors py-8">
                Contact
              </Link>
              <Link href="/faqs" className="text-secondary hover:text-primary font-bold uppercase tracking-wider text-sm transition-colors py-8">
                FAQs
              </Link>
              <Link href="/gallery" className="text-secondary hover:text-primary font-bold uppercase tracking-wider text-sm transition-colors py-8">
                Snaps
              </Link>
              <Link href="/partners" className="text-secondary hover:text-primary font-bold uppercase tracking-wider text-sm transition-colors py-8">
                Partners
              </Link>
            </nav>

            <form onSubmit={handleSearch} className="relative ml-8 max-w-xs w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gear..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-medium"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            </form>
          </div>

          {/* Cart, Account & Mobile Toggle */}
          <div className="flex items-center space-x-2 md:space-x-4 ml-4">
            <Link href={user ? "/account" : "/login"} className="p-2 text-secondary hover:text-primary transition-colors" title="Account">
              <User size={24} />
            </Link>
            {user && (
              <button onClick={handleLogout} className="p-2 text-secondary hover:text-primary transition-colors" title="Log out">
                <LogOut size={20} />
              </button>
            )}
            <Link href="/wishlist" className="relative p-2 text-secondary hover:text-primary transition-colors" title="Wishlist">
              <Heart size={24} />
              {isMounted && wishlistItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-[10px] font-black leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-primary rounded-full shadow-md">
                  {wishlistItems}
                </span>
              )}
            </Link>
            <Link href="/cart" className="relative p-2 text-secondary hover:text-primary transition-colors" title="Cart">
              <ShoppingCart size={24} />
              {isMounted && totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-[10px] font-black leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-primary rounded-full shadow-md">
                  {totalItems}
                </span>
              )}
            </Link>
            
            <button 
              className="md:hidden p-2 text-secondary hover:text-primary"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 max-h-[80vh] overflow-y-auto">
          <div className="px-6 py-6">
            <form onSubmit={handleSearch} className="relative mb-8">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gear..."
                className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white font-bold text-secondary uppercase tracking-widest"
              />
              <Search className="absolute left-3 top-4 text-slate-400" size={18} />
            </form>
            <div className="space-y-4">
              <div>
                <button 
                  className="flex items-center justify-between w-full text-left text-base font-black uppercase tracking-widest text-secondary mb-4"
                  onClick={() => setIsShopOpen(!isShopOpen)}
                >
                  Shop Gear <ChevronDown size={18} className={`transition-transform duration-200 ${isShopOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isShopOpen && (
                  <div className="pl-4 space-y-3 mb-6 border-l-2 border-primary/20">
                    <Link 
                      href="/products" 
                      className="block text-sm font-bold uppercase tracking-wider text-slate-500 hover:text-primary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      All Products
                    </Link>
                    {categories.map((cat) => (
                      <Link 
                        key={cat.slug}
                        href={`/products?category=${cat.slug}`} 
                        className="block text-sm font-bold uppercase tracking-wider text-slate-500 hover:text-primary"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              
              <Link 
                href="/blog" 
                className="block text-base font-black uppercase tracking-widest text-secondary hover:text-primary py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Logbook
              </Link>
              <Link 
                href="/about-us" 
                className="block text-base font-black uppercase tracking-widest text-secondary hover:text-primary py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className="block text-base font-black uppercase tracking-widest text-secondary hover:text-primary py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <Link 
                href="/faqs" 
                className="block text-base font-black uppercase tracking-widest text-secondary hover:text-primary py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                FAQs
              </Link>
              <Link 
                href="/gallery" 
                className="block text-base font-black uppercase tracking-widest text-secondary hover:text-primary py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Snaps
              </Link>
              <Link 
                href="/partners" 
                className="block text-base font-black uppercase tracking-widest text-secondary hover:text-primary py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Partners
              </Link>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
                <Link 
                href="/wishlist" 
                className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-secondary"
                onClick={() => setIsMenuOpen(false)}
               >
                 <Heart size={18} /> Wishlist ({wishlistItems})
               </Link>
               <Link 
                href={user ? "/account" : "/login"} 
                className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-secondary"
                onClick={() => setIsMenuOpen(false)}
               >
                 <User size={18} /> {user ? "My Account" : "Sign In"}
               </Link>
               {user && (
                 <button onClick={handleLogout} className="text-xs font-black uppercase tracking-widest text-rose-500">
                   Log Out
                 </button>
               )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
