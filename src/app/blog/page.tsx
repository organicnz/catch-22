import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { SPAM_KEYWORDS } from '@/lib/sanitize';

export const revalidate = 3600; // Cache for 1 hour

const POSTS_PER_PAGE = 12;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createClient();
  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams.page) || 1;
  const from = (currentPage - 1) * POSTS_PER_PAGE;
  const to = from + POSTS_PER_PAGE - 1;

  // We need to fetch with filtering for spam first to get an accurate count, 
  // or fetch all and filter in memory if the dataset is small.
  // Given we have ~277 items, filtering in memory is fine for now but let's try to be efficient.
  
  const { data: posts, error, count } = await supabase
    .from('content')
    .select('id, title, slug, created_at', { count: 'exact' })
    .eq('status', 'publish')
    .eq('type', 'post')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching blog posts:', error);
    return <div className="p-8 text-center text-red-500 font-bold uppercase tracking-widest">Failed to load logbook.</div>;
  }

  const filteredPosts = posts?.filter(post => {
    const titleLower = post.title.toLowerCase();
    const isSpam = SPAM_KEYWORDS.some(keyword => titleLower.includes(keyword));
    const hasNonLatin = /[^\u0000-\u007F\u00A0-\u00FF]/.test(post.title) && !titleLower.includes('catch-22');
    return !isSpam && !hasNonLatin;
  }) || [];

  const totalFiltered = filteredPosts.length;
  const totalPages = Math.ceil(totalFiltered / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(from, to + 1);

  return (
    <div className="bg-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-secondary uppercase tracking-tight mb-4">
            The Logbook
          </h1>
          <div className="h-2 w-24 bg-primary"></div>
          <p className="mt-6 text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
            Stories, tips, and updates from the Catch-22 team. Follow our adventures in the elements.
          </p>
        </div>
        
        <div className="grid gap-12">
          {paginatedPosts.map((post) => (
            <article key={post.id} className="group relative border-b border-slate-100 pb-12 transition-all hover:border-primary/30">
              <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-4">
                <h2 className="text-2xl md:text-3xl font-black text-secondary group-hover:text-primary transition-colors uppercase leading-tight flex-1">
                  <Link href={`/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>
                <time dateTime={post.created_at} className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                  {new Date(post.created_at).toLocaleDateString('en-NZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
              <div className="mt-6">
                 <Link href={`/${post.slug}`} className="text-sm font-black text-primary uppercase tracking-widest hover:text-secondary transition-colors inline-flex items-center gap-2">
                    Read the entry <span>&rarr;</span>
                 </Link>
              </div>
            </article>
          ))}

          {filteredPosts.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
               <p className="text-slate-400 font-black uppercase tracking-widest">No logbook entries found.</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-20 flex justify-center items-center gap-4">
            {currentPage > 1 && (
              <Link 
                href={`/blog?page=${currentPage - 1}`}
                className="px-6 py-3 rounded-full bg-slate-100 text-secondary font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all"
              >
                Previous
              </Link>
            )}
            
            <div className="flex gap-2">
               {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                 // Logic to show a window of pages could be added here
                 const pageNum = i + 1;
                 return (
                   <Link 
                    key={pageNum}
                    href={`/blog?page=${pageNum}`}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-xs font-black transition-all ${currentPage === pageNum ? 'bg-secondary text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}
                   >
                     {pageNum}
                   </Link>
                 );
               })}
            </div>

            {currentPage < totalPages && (
              <Link 
                href={`/blog?page=${currentPage + 1}`}
                className="px-6 py-3 rounded-full bg-slate-100 text-secondary font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
