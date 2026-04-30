import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Partners - Catch-22',
  description: 'Meet the partners who test and trust Catch-22 gear in the elements.',
};

export default function PartnersPage() {
  const partners = [
    {
      name: 'Ham & Ty\'s Fishing Adventures',
      description: 'Follow Ham & Ty for some off the hook entertainment. Check out their shop for custom mugs, hats, and the legendary Sledger Rigs.',
      link: 'https://www.hamandtys.com/',
      image: '/partner-ham-ty.jpg'
    },
    {
      name: 'Northland Fishing and Mental Wellness Support Group',
      description: 'A dedicated initiative combining the healing power of fishing and the outdoors with community support for mental wellness. A safe place to share and heal.',
      link: 'https://givealittle.co.nz/cause/northland-fishing-and-mental-wellness-support-group',
      image: '/snap1.jpg' // Using a generic snap as placeholder if no partner logo exists
    },
    {
      name: 'NZ ANGLER',
      description: 'Our mates down at NZ ANGLER provide solid acidwrap rods and pro-series reels for the serious fisho.',
      link: 'https://nzangler.co.nz/',
      image: '/snap2.jpg' // Using a generic snap as placeholder
    },
    {
      name: 'THUNDER Charter',
      description: 'Run by Charles at Bay of Plenty Boat Hire. A premier charter experience testing Catch-22 gear in the toughest conditions.',
      link: 'https://www.bayofplentyboathire.co.nz',
      image: '/partner-thunder.jpg'
    },
    {
      name: 'Sea Cleaners',
      description: 'Dedicated to preserving our New Zealand coastlines. We are proud to support their mission by donating 2.5% of all profits.',
      link: 'https://seacleaners.org.nz/',
      image: '/partner-seacleaners.jpg'
    }
  ];

  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-4xl font-black text-secondary uppercase tracking-tight mb-4">Our Partners</h1>
          <div className="h-2 w-24 bg-primary"></div>
          <p className="mt-6 text-slate-500 font-medium text-lg max-w-2xl">
            We work with the best in the business to ensure our gear is truly tried and true.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {partners.map((partner, idx) => (
            <div key={idx} className="group bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-secondary/20 group-hover:bg-secondary/10 transition-colors z-10"></div>
                <Image 
                  src={partner.image} 
                  alt={partner.name} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-8">
                <h2 className="text-2xl font-black text-secondary uppercase mb-4 leading-tight">
                  {partner.name}
                </h2>
                <p className="text-slate-600 font-medium mb-8 line-clamp-3">
                  {partner.description}
                </p>
                <a 
                  href={partner.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block bg-white text-secondary border-2 border-secondary hover:bg-secondary hover:text-white font-black py-3 px-8 rounded-full transition-all uppercase tracking-widest text-xs"
                >
                  Visit Website
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center">
           <h3 className="text-xl font-black text-secondary uppercase tracking-[0.2em] mb-8">Want to partner with us?</h3>
           <a 
            href="/contact" 
            className="text-primary font-black uppercase tracking-widest border-b-2 border-primary hover:text-secondary hover:border-secondary transition-all"
           >
             Get in touch today
           </a>
        </div>
      </div>
    </div>
  );
}
