import { createServerClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { sanitizeWPContent } from '@/lib/sanitize';

export const revalidate = 3600; // Cache for 1 hour

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createServerClient();
  const slug = (await params).slug;
  
  const { data: content } = await supabase
    .from('content')
    .select('title, body')
    .eq('slug', slug)
    .eq('status', 'publish')
    .single();

  if (!content) {
    return { title: 'Not Found' };
  }

  const cleanBody = sanitizeWPContent(content.body || '');
  const rawText = cleanBody.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
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
  const supabase = await createServerClient();
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
    <div className="bg-white min-h-screen pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-secondary uppercase mb-4 leading-tight">
            {content.title}
          </h1>
          <div className="h-2 w-24 bg-primary"></div>
          {content.type === 'post' && content.created_at && (
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
             <Link href="/" className="text-sm font-black text-secondary uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2">
                <span>&larr;</span> Back to Home
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
