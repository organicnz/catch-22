import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catch-Snaps - Catch-22',
  description: 'See the latest catches from the Catch-22 community. Send us your catch snaps today!',
};

export default function GalleryPage() {
  // Placeholder images for the gallery
  const snaps = [
    { src: '/snap1.jpg', alt: 'Big catch in NZ' },
    { src: '/snap2.jpg', alt: 'Fishing at sunrise' },
    { src: '/snap3.jpg', alt: 'Tested gear in action' },
    { src: '/snap4.jpg', alt: 'Thunder Charter catch' },
    { src: '/snap5.jpg', alt: 'Coastal fishing New Zealand' },
    { src: '/snap6.jpg', alt: 'Premium braid in use' },
  ];

  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-4xl font-black text-secondary uppercase tracking-tight mb-4">Catch-22 Snaps</h1>
          <div className="h-2 w-24 bg-primary"></div>
          <p className="mt-6 text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
            Real gear, real catches. Send us your Catch-22 snaps today to be featured on our logbook and social media.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-12">
          {snaps.map((snap, idx) => (
            <div key={idx} className="aspect-[4/5] relative group rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 ease-out">
               <Image 
                src={snap.src} 
                alt={snap.alt} 
                fill 
                className="object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                  <p className="text-white font-black uppercase tracking-[0.3em] text-[10px] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                    {snap.alt}
                  </p>
                  <div className="h-1 w-12 bg-primary mt-3 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 delay-200 origin-left" />
               </div>
            </div>
          ))}
        </div>

        <div className="mt-32 text-center bg-slate-50/50 backdrop-blur-sm p-16 rounded-[4rem] border border-slate-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-5 rounded-full blur-[100px] pointer-events-none" />
           <div className="relative z-10">
              <h3 className="text-3xl font-black text-secondary uppercase mb-6 tracking-tighter">Want to be featured?</h3>
              <p className="text-slate-500 mb-12 max-w-xl mx-auto font-medium text-lg leading-relaxed">
                Tag us in your photos or send them directly to our team via the contact form. 
                We love seeing our gear in the wild!
              </p>
              <a 
               href="/contact" 
               className="inline-block bg-secondary text-white font-black py-6 px-16 rounded-full transition-all uppercase tracking-[0.3em] text-xs hover:bg-primary shadow-2xl shadow-secondary/20 hover:scale-105"
              >
                Submit Your Snap
              </a>
           </div>
        </div>
      </div>
    </div>
  );
}
