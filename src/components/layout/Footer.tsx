import Link from 'next/link';
import Image from 'next/image';
import { Quote } from 'lucide-react';
import { getStorageUrl } from '@/lib/supabase';

export function Footer() {
  return (
    <footer className="bg-secondary text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="inline-block">
              <Image 
                src={getStorageUrl('site/logo.png')} 
                alt="Catch-22" 
                width={120} 
                height={60} 
                className="h-10 w-auto brightness-0 invert" 
              />
            </Link>
            <p className="mt-6 text-sm text-slate-300 leading-relaxed">
              Catch-22 is dedicated to providing premium fishing gear that performs in the elements. We believe in quality, durability, and giving back to the ocean.
            </p>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-primary text-sm font-black uppercase tracking-widest mb-6">Navigation</h3>
            <ul className="grid grid-cols-2 gap-4 text-sm font-bold">
              <li><Link href="/" className="hover:text-primary transition-colors uppercase tracking-wider">Home</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors uppercase tracking-wider">Shop</Link></li>
              <li><Link href="/gallery" className="hover:text-primary transition-colors uppercase tracking-wider">Snaps</Link></li>
              <li><Link href="/partners" className="hover:text-primary transition-colors uppercase tracking-wider">Visit Our Partners</Link></li>
              <li><Link href="/faqs" className="hover:text-primary transition-colors uppercase tracking-wider">FAQs</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors uppercase tracking-wider">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-primary text-sm font-black uppercase tracking-widest mb-6">Legal</h3>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link href="/terms-and-conditions" className="hover:text-primary transition-colors uppercase tracking-wider">Terms of Service</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-primary transition-colors uppercase tracking-wider">Privacy Policy</Link></li>
              <li><Link href="/shipping-returns" className="hover:text-primary transition-colors uppercase tracking-wider">Shipping & Returns</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Catch-22.co.nz. Built for the elements.
          </div>
          <div className="flex gap-6">
             {/* Placeholder for social icons */}
             <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Follow our catch</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
