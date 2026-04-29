'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useCartStore } from '@/lib/store/cart';

export default function SuccessPage() {
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    // Clear the cart when the user successfully checks out
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border border-slate-100">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Payment Successful!</h1>
        <p className="text-slate-600 mb-8 font-medium">
          Thank you for your order. We are preparing it for shipment right now.
        </p>
        <Link 
          href="/products"
          className="w-full inline-block py-4 px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}