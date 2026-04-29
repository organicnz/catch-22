import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border border-slate-100">
        <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Checkout Cancelled</h1>
        <p className="text-slate-600 mb-8 font-medium">
          No charges were made. You can review your cart and try again when you're ready.
        </p>
        <Link 
          href="/products"
          className="w-full inline-block py-4 px-6 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
        >
          Return to Store
        </Link>
      </div>
    </div>
  );
}