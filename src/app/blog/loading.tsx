export default function Loading() {
  return (
    <div className="bg-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="flex flex-col mb-16">
          <div className="h-12 w-64 bg-slate-100 rounded-lg mb-4"></div>
          <div className="h-2 w-24 bg-primary/20"></div>
          <div className="mt-6 space-y-2">
            <div className="h-4 w-full bg-slate-50 rounded"></div>
            <div className="h-4 w-3/4 bg-slate-50 rounded"></div>
          </div>
        </div>
        
        <div className="space-y-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b border-slate-100 pb-12">
               <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-4">
                  <div className="h-8 w-3/4 bg-slate-100 rounded-lg"></div>
                  <div className="h-4 w-24 bg-slate-50 rounded"></div>
               </div>
               <div className="mt-6 h-4 w-32 bg-slate-50 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
