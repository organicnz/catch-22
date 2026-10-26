'use client';

import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Heart, LogOut, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useCartStore } from '@/lib/store/cart';
import { useSettingsStore } from '@/lib/store/settings';
import { useWishlistStore } from '@/lib/store/wishlist';
import { createClient, getStorageUrl } from '@/lib/supabase';

const NAV_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'Shop', href: '/products' },
  { name: 'Snaps', href: '/gallery' },
  { name: 'Visit Our Partners', href: '/partners' },
  { name: 'FAQs', href: '/faqs' },
  { name: 'Contact', href: '/contact' },
];

export function Header() {
  return (
    <Suspense fallback={<HeaderFallback />}>
      <HeaderInner />
    </Suspense>
  );
}

// Static-shell placeholder: matches the solid header's height so dynamic-route
// shells have zero CLS. Hero pages ('/', '/gallery') resolve usePathname during
// their own prerender, so they never show this fallback.
function HeaderFallback() {
  return (
    <header className="bg-secondary py-6 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Image
          src={getStorageUrl('site/logo.png')}
          unoptimized
          alt="CATCH-22"
          width={319}
          height={225}
          className="h-16 md:h-24 w-auto"
          sizes="(max-width: 768px) 120px, 240px"
          priority
        />
        <div className="hidden lg:flex items-center gap-10" aria-hidden="true">
          {NAV_LINKS.map((link) => (
            <span
              key={link.name}
              className="text-[10px] font-black uppercase tracking-[0.4em] text-white/70"
            >
              {link.name}
            </span>
          ))}
        </div>
        <div className="w-24" aria-hidden="true" />
      </div>
    </header>
  );
}

function HeaderInner() {
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<SupabaseUser | null>(null);

  const totalItems = useCartStore((state) => state.totalItems());
  const wishlistItems = useWishlistStore((state) => state.items.length);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Pages that should have a transparent header initially
  const isTransparentPage = pathname === '/' || pathname === '/gallery';

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps — mount flag must be set once after effect registration; no deps needed
    setIsMounted(true);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
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
    useSettingsStore.getState().reset();
    router.push('/');
  };

  const headerBg = isScrolled
    ? 'bg-secondary/95 backdrop-blur-2xl py-4 shadow-2xl border-b border-white/5'
    : isTransparentPage
      ? 'bg-transparent py-8'
      : 'bg-secondary py-6 border-b border-white/5';

  const logoInvert = !isScrolled && isTransparentPage ? 'brightness-0 invert' : '';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${headerBg}`}>
      <div className="max-w-[1800px] mx-auto px-6 md:px-12">
        <div className="flex justify-between items-center">
          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="lg:hidden p-2 -ml-2 text-white hover:text-primary transition-colors"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
          >
            <Menu size={24} />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            <Image
              src={getStorageUrl('site/logo.png')}
              unoptimized
              alt="CATCH-22"
              width={319}
              height={225}
              className={`h-16 md:h-24 w-auto transition-all duration-500 ${logoInvert}`}
              sizes="(max-width: 768px) 120px, 240px"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-[10px] font-black uppercase tracking-[0.4em] transition-all hover:text-primary relative group ${
                  pathname === link.href ? 'text-primary' : 'text-white/70'
                }`}
              >
                {link.name}
                <span
                  className={`absolute -bottom-2 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full ${pathname === link.href ? 'w-full' : ''}`}
                />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-8">
            {/* Search Bar - Strictly Circular */}
            <form onSubmit={handleSearch} className="hidden xl:block relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-12 h-12 focus:w-64 pl-12 pr-6 py-2 bg-white/5 border border-white/10 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white/10 focus:text-white transition-all duration-500 font-black uppercase tracking-widest placeholder:text-white/20 text-transparent focus:text-white"
              />
              <Search
                className="absolute left-4 top-3.5 text-white/40 group-focus-within:text-primary transition-colors pointer-events-none"
                size={18}
              />
            </form>

            <div className="flex items-center gap-1 md:gap-4">
              <div className="flex items-center gap-1">
                <Link
                  href={user ? '/account' : '/login'}
                  className="p-3 rounded-full text-white hover:bg-white/10 hover:text-primary transition-all"
                  aria-label="Account"
                >
                  <User size={20} />
                </Link>
                {user && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="hidden md:flex p-3 rounded-full text-white hover:bg-white/10 hover:text-red-500 transition-all"
                    aria-label="Sign out"
                  >
                    <LogOut size={20} />
                  </button>
                )}
              </div>

              <Link
                href="/wishlist"
                className="relative p-3 rounded-full text-white hover:bg-white/10 hover:text-primary transition-all"
                aria-label={`Wishlist${isMounted && wishlistItems > 0 ? ` (${wishlistItems} items)` : ''}`}
              >
                <Heart size={20} />
                {isMounted && wishlistItems > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-secondary text-[8px] font-black rounded-full flex items-center justify-center border-2 border-secondary">
                    {wishlistItems}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                className="relative p-3 rounded-full text-white hover:bg-white/10 hover:text-primary transition-all"
                aria-label={`Cart${isMounted && totalItems > 0 ? ` (${totalItems} items)` : ''}`}
              >
                <ShoppingBag size={20} />
                {isMounted && totalItems > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-secondary text-[8px] font-black rounded-full flex items-center justify-center border-2 border-secondary">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[100] bg-secondary flex flex-col p-8 lg:hidden transition-all duration-700 ease-sensory ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-secondary font-black text-xl italic">22</span>
            </div>
            <span className="text-xl font-black uppercase tracking-tighter text-white">
              Catch 22
            </span>
          </div>
          <button
            type="button"
            className="p-4 text-white hover:text-primary transition-colors"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={32} />
          </button>
        </div>

        <nav className="flex flex-col gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className={`text-4xl font-black uppercase tracking-tighter transition-colors ${
                pathname === link.href ? 'text-primary' : 'text-white hover:text-primary'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-12 border-t border-white/5 flex flex-col gap-8">
          <div className="flex justify-between items-center">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black italic">
                  {user.email?.[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                    Logged In As
                  </p>
                  <p className="text-sm font-bold text-white">{user.email}</p>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="text-primary font-black uppercase tracking-widest text-xs"
              >
                Sign In / Join
              </Link>
            )}
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="text-red-500 font-black uppercase tracking-widest text-xs flex items-center gap-2"
              >
                <LogOut size={14} /> Exit
              </button>
            )}
          </div>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] text-center">
            Engineered for the Elements
          </p>
        </div>
      </div>
    </header>
  );
}
