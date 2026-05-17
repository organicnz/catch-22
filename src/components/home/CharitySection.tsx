import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

export function CharitySection() {
  return (
    <section className="py-32 bg-secondary border-t border-white/5 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-20 lg:gap-32">
          <div className="lg:w-1/2 relative">
            <div className="relative aspect-video rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] z-10 border border-white/10 bg-black group">
              <Image
                src="/seacleaners-logos.png"
                alt="Sea Cleaners NZ"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-12 group-hover:scale-110 transition-transform duration-[2000ms] ease-out"
              />
              <div className="absolute inset-0 bg-linear-to-t from-secondary/40 via-transparent to-transparent opacity-60" />
            </div>
            {/* Decorative background element */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary opacity-10 rounded-full blur-3xl z-0"></div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary opacity-5 rounded-full blur-3xl z-0"></div>
          </div>

          <div className="lg:w-1/2 max-w-2xl">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-10">
              <Heart className="w-3 h-3 text-primary fill-primary" />
              <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">Guardians of the Coast</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-10">
              Protecting Our <br /> <span className="text-primary italic">Playground</span>
            </h2>
            
            <p className="text-slate-400 text-lg md:text-xl font-medium mb-12 leading-relaxed">
              At Catch-22, we believe in preserving the rugged beauty of the New Zealand coast. 
              A portion of every purchase goes directly to <span className="text-white font-black italic underline decoration-primary decoration-4 underline-offset-8">Sea Cleaners</span>, 
              helping remove plastic and debris from our oceans to ensure future generations can experience the same thrill of the chase.
            </p>

            <Link 
              href="/about-us" 
              className="group inline-flex items-center gap-6 text-white font-black uppercase tracking-[0.4em] text-[10px] hover:text-primary transition-all"
            >
              Learn about our mission <span className="text-2xl group-hover:translate-x-4 transition-transform text-primary">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
