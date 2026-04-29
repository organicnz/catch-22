import { createClient } from '@/lib/supabase';
import Link from 'next/link';

export const revalidate = 3600; // Cache for 1 hour

export default async function BlogPage() {
  const supabase = createClient();
  
  const { data: posts, error } = await supabase
    .from('content')
    .select('id, title, slug, created_at')
    .eq('status', 'publish')
    .eq('type', 'post')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching blog posts:', error);
    return <div className="p-8 text-center text-red-500">Failed to load blog posts.</div>;
  }

  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-12">
          The Catch-22 Logbook
        </h1>
        
        <div className="space-y-12">
          {posts?.map((post) => (
            <article key={post.id} className="group relative">
              <h2 className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
                <Link href={`/${post.slug}`}>
                  <span className="absolute inset-0" />
                  {post.title}
                </Link>
              </h2>
              <time dateTime={post.created_at} className="text-sm text-slate-500 font-medium block">
                {new Date(post.created_at).toLocaleDateString('en-NZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </article>
          ))}

          {posts?.length === 0 && (
            <p className="text-slate-500 text-lg">No logbook entries found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
