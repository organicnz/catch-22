import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Capt. Finn",
    role: "Thunder Charters",
    content: "We've been using Catch-22 braid on our commercial rigs for two seasons now. It's the only line that stands up to the abrasion of the Three Kings coast.",
    stars: 5
  },
  {
    name: "Sarah Jenkins",
    role: "Tournament Angler",
    content: "The feedback through the rod with this braid is incredible. I can feel every micro-touch, even in deep water. A complete game changer for my setup.",
    stars: 5
  },
  {
    name: "Mike Thompson",
    role: "Weekend Warrior",
    content: "Finally, a premium brand that actually understands NZ conditions. The lures are practically indestructible and the colors are perfectly matched to our baitfish.",
    stars: 5
  }
];

export function TestimonialSection() {
  return (
    <section className="py-40 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-xl mb-24">
          <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Proven Performance</span>
          <h2 className="text-5xl md:text-7xl font-black text-secondary uppercase tracking-tighter leading-[0.9]">
            Trusted By <br /> <span className="text-slate-300">The Pros</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {testimonials.map((t, i) => (
            <div key={i} className="group p-10 lg:p-12 rounded-[3.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-[0_80px_100px_-30px_rgba(0,0,0,0.1)] hover:-translate-y-3 transition-all duration-700 ease-out">
              <div className="flex gap-1 mb-10">
                {[...Array(t.stars)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                ))}
              </div>
              
              <div className="relative mb-10">
                <Quote className="w-12 h-12 text-primary/10 absolute -top-4 -left-4 group-hover:text-primary/20 transition-colors duration-500" />
                <p className="text-slate-600 font-medium text-lg lg:text-xl leading-relaxed relative z-10 italic">
                  "{t.content}"
                </p>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <h4 className="font-black text-secondary uppercase tracking-[0.2em] text-xs">{t.name}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Decorative background flair */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary opacity-[0.03] rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary opacity-[0.02] rounded-full blur-[150px] translate-x-1/4 translate-y-1/4" />
    </section>
  );
}
