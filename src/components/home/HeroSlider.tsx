'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getStorageUrl } from '@/lib/supabase';

const slides = [
  {
    image: 'site/thunder-charter.jpg',
    upperTitle: 'Established NZ 2020',
    title: 'Built to',
    highlight: 'Endure.',
    description: 'Premium fishing gear, apparel, and accessories tested in the harshest New Zealand environments.',
    cta: 'Explore Collection',
    link: '/products'
  },
  {
    image: 'site/about-hero.jpg',
    upperTitle: 'Proven Performance',
    title: 'Tried and',
    highlight: 'True.',
    description: 'Tested by experts, trusted by charters. We provide tools that stand up to the challenge.',
    cta: 'Our Story',
    link: '/about-us'
  },
  {
    image: 'site/snap1.jpg',
    upperTitle: 'Community First',
    title: 'Join the',
    highlight: 'Crew.',
    description: 'A community of dedicated anglers sharing their best moments from the NZ coastline.',
    cta: 'View Gallery',
    link: '/gallery'
  }
];

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section aria-label="Hero — Explore our World" className="relative h-[85vh] min-h-[700px] flex items-center overflow-hidden bg-secondary">
      {/* Background Images */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-60 z-0 scale-100' : 'opacity-0 -z-10 scale-110'
          }`}
          style={{ transition: 'opacity 1500ms ease-in-out, transform 8000ms linear' }}
        >
          <Image
            src={getStorageUrl(slide.image)}
            alt={slide.title}
            fill
            className="object-cover"
            priority={index === 0}
          />
        </div>
      ))}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-secondary z-1" />
      <div className="absolute inset-0 bg-gradient-to-r from-secondary/40 via-transparent to-transparent z-1" />

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-4xl">
          <span className="text-primary font-black uppercase tracking-[0.5em] text-[10px] md:text-xs mb-8 block animate-fade-in key-{currentSlide}">
            {slides[currentSlide].upperTitle}
          </span>
          <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tight text-white uppercase leading-[0.8] mb-12 animate-fade-in transition-all duration-700">
            {slides[currentSlide].title} <br /> 
            <span className="text-primary italic">{slides[currentSlide].highlight}</span>
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-slate-300 font-medium mb-16 max-w-2xl leading-relaxed animate-fade-in delay-200">
            {slides[currentSlide].description}
          </p>
          <div className="flex flex-wrap gap-8 items-center animate-fade-in delay-500">
            <Link
              href={slides[currentSlide].link}
              className="group relative inline-flex items-center justify-center bg-primary text-secondary font-black py-6 px-16 rounded-full transition-all duration-500 uppercase tracking-[0.3em] text-xs shadow-2xl shadow-primary/20 hover:scale-105"
            >
              {slides[currentSlide].cta}
            </Link>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-12 right-12 flex gap-4 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className="group relative h-1 w-12 bg-white/20 rounded-full overflow-hidden transition-all hover:bg-white/40"
            aria-label={`Go to slide ${index + 1}`}
          >
            {index === currentSlide && (
              <div 
                className="absolute top-0 left-0 h-full bg-primary animate-[progress_6s_linear_forwards]"
                style={{ width: '100%' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 text-white/40 z-20 hidden md:flex">
         <span className="text-[8px] font-black uppercase tracking-[0.5em] vertical-rl">Scroll</span>
         <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
      </div>

      <style jsx>{`
        @keyframes progress {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
