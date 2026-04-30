import Image from 'next/image';
import Link from 'next/link';

export function CharitySection() {
  return (
    <section aria-label="Charity — Sea Cleaners donation" className="bg-secondary py-20 text-white relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24">
          <div className="lg:w-1/2">
            <div className="flex items-center gap-6 mb-8">
               <div className="w-20 h-20 bg-primary rounded-3xl rotate-12 flex items-center justify-center text-secondary font-black text-3xl shadow-2xl shadow-primary/20">2.5%</div>
               <div className="h-px w-24 bg-primary/30 hidden md:block"></div>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85] mb-8">
              Protecting <br /> <span className="text-primary">The Waters</span> <br /> We Love
            </h2>
            
            <p className="text-lg text-slate-300 font-medium mb-12 max-w-xl leading-relaxed">
              We donate 2.5% of all profits to the <strong className="text-white">NZ Sea Cleaners Charity Trust</strong>. Every purchase you make directly contributes to removing plastic and debris from New Zealand&apos;s coastlines.
            </p>

            <div className="flex flex-wrap gap-6 items-center">
              <Link href="/about-us" className="bg-primary hover:bg-primary-dark text-secondary font-black py-4 px-10 rounded-full transition-all uppercase tracking-widest text-xs">
                Our Mission
              </Link>
              <a href="https://seacleaners.org.nz/" target="_blank" rel="noopener noreferrer" className="text-xs font-black uppercase tracking-[0.3em] text-primary border-b border-primary/40 hover:border-primary transition-all">
                Visit Sea Cleaners
              </a>
            </div>
          </div>

          <div className="lg:w-1/2 relative group">
            <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]">
              <Image 
                src="/partner-seacleaners.jpg"
                alt="NZ Sea Cleaners boat in action"
                fill
                className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-transparent opacity-60" />
            </div>
            {/* Floating label */}
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-2xl hidden md:block">
              <p className="text-secondary font-black uppercase tracking-widest text-[10px] mb-1">Impact Report</p>
              <p className="text-2xl font-black text-secondary tracking-tighter">10,000+ KG</p>
              <p className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">Plastic Removed Yearly</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
