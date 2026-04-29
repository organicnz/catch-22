import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="text-white text-xl font-bold tracking-tight">CATCH-22</span>
            <p className="mt-4 text-sm text-slate-400 max-w-xs">
              Premium fishing gear and apparel. Designed for the elements, built to last.
            </p>
          </div>
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Shop</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/cart" className="hover:text-white transition-colors">Your Cart</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-800 text-sm text-center text-slate-500">
          &copy; {new Date().getFullYear()} Catch-22.co.nz. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
