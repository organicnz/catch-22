import { createClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 3600; // Cache for 1 hour

// Helper to sanitize old WordPress artifacts and remove hack-injected spam
function sanitizeWPContent(html: string) {
  if (!html) return '';
  
  let clean = html;
  
  // 1. Remove Gutenberg block comments
  clean = clean.replace(/<!--\s*\/?wp:.*?-->/g, '');
  
  // 2. Remove specific shortcodes
  clean = clean.replace(/\[wpforms[^\]]*\]/g, '<div class="p-4 bg-slate-50 border border-slate-100 rounded-2xl my-8 text-secondary font-bold uppercase tracking-widest text-xs text-center">Please use our official <a href="/contact" class="text-primary underline">Contact Page</a> to reach out.</div>');
  
  // 3. Remove known spam keywords and their surrounding elements
  const spamRegex = new RegExp('<a [^>]*?href=["\'](https?:\\/\\/(?!(catch-22\\.co\\.nz|i0\\.wp\\.com|i1\\.wp\\.com|i2\\.wp\\.com|supabase\\.co))[^"\']+)["\'][^>]*?>.*?<\\/a>', 'gi');
  clean = clean.replace(spamRegex, '');

  // 4. Remove blocks of suspicious links
  clean = clean.replace(/(<a [^>]*?>.*?<\/a>\s*){5,}/gi, '');

  // 5. Final cleanup
  clean = clean.replace(/<p>\s*<\/p>/g, '');
  
  return clean;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = (await params).slug;
  const supabase = createClient();
  
  const { data: content } = await supabase
    .from('content')
    .select('title, body')
    .eq('slug', slug)
    .eq('status', 'publish')
    .single();

  if (!content) {
    return { title: 'Not Found' };
  }

  const rawText = content.body ? content.body.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim() : '';
  const description = rawText.length > 150 ? rawText.substring(0, 147) + '...' : rawText;

  return {
    title: `${content.title} | Catch-22`,
    description: description,
    openGraph: {
      title: content.title,
      description: description,
    },
  };
}

export default async function ContentPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const slug = (await params).slug;
  
  const { data: content, error } = await supabase
    .from('content')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'publish')
    .single();

  if (error || !content) {
    return notFound();
  }

  const cleanBody = sanitizeWPContent(content.body || '');

  return (
    <div className="bg-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-secondary uppercase mb-4 leading-tight">
            {content.title}
          </h1>
          <div className="h-2 w-24 bg-primary"></div>
          {content.type === 'post' && (
            <time dateTime={content.created_at} className="mt-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
               Published {new Date(content.created_at).toLocaleDateString('en-NZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
            </time>
          )}
        </div>
        
        <div 
          className="prose prose-slate prose-lg max-w-none 
            prose-headings:text-secondary prose-headings:uppercase prose-headings:font-black
            prose-p:text-slate-600 prose-p:leading-relaxed
            prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline
            prose-strong:text-secondary prose-strong:font-black
            prose-img:rounded-3xl prose-img:shadow-lg"
          dangerouslySetInnerHTML={{ __html: cleanBody }}
        />
        
        {content.type === 'post' && (
          <div className="mt-20 pt-10 border-t border-slate-100 flex justify-between items-center">
             <Link href="/blog" className="text-sm font-black text-secondary uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2">
                <span>&larr;</span> Back to Logbook
             </Link>
             <div className="flex gap-4">
                {/* Social share placeholders */}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
