import { ShoppingCart } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="px-6 py-4 bg-white border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 font-mono">CATCH-22</h1>
      </header>
      
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShoppingCart size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">V2 MIGRATION</h2>
          <p className="text-slate-500 mb-8 text-sm uppercase tracking-widest font-semibold">
            Next.js + Supabase + Stripe Link
          </p>
          
          <div className="p-4 bg-slate-50 rounded-xl mb-8 border border-slate-100">
            <p className="text-xs text-slate-400 font-mono">STATUS: INITIALIZED</p>
          </div>
          
          <button 
            disabled
            className="w-full py-4 px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            SYSTEMS READY
          </button>
        </div>
      </main>

      <footer className="p-6 text-center text-slate-400 text-xs font-medium uppercase tracking-tighter">
        &copy; 2026 CATCH-22.CO.NZ
      </footer>
    </div>
  )
}
