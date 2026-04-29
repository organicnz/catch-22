import { createClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export const revalidate = 3600; // Cache for 1 hour

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

  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-8">
          {content.title}
        </h1>
        <div 
          className="prose prose-slate prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: content.body || '' }}
        />
      </div>
    </div>
  );
}
