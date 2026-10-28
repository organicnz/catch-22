import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AddToCartButton } from '@/components/checkout/AddToCartButton';
import { AfterpayInfoModal } from '@/components/checkout/AfterpayInfoModal';
import { NZCheckoutConfidence } from '@/components/checkout/NZCheckoutConfidence';
import { NZPaymentOptionsGuide } from '@/components/checkout/NZPaymentOptionsGuide';
import { PaymentMethodStrip } from '@/components/checkout/PaymentIcons';
import { ProductSlider } from '@/components/products/ProductSlider';
import { WishlistButton } from '@/components/products/WishlistButton';
import {
  getAllProductSlugs,
  getProductDetail,
  getProductMeta,
  getRelatedProducts,
} from '@/lib/queries/products';
import { sanitizeWPContent } from '@/lib/sanitize';
import { getStorageUrl } from '@/lib/supabase';
import type { Json } from '@/types/supabase';

export async function generateStaticParams() {
  return getAllProductSlugs();
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = (await params).slug;
  const product = await getProductMeta(slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const rawDescription = product.short_description || product.description || '';
  const cleanDescription = rawDescription
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  const description =
    cleanDescription.length > 150 ? `${cleanDescription.substring(0, 147)}...` : cleanDescription;

  return {
    alternates: { canonical: `/products/${slug}` },
    title: `${product.name} | Catch-22 Gear`,
    description: description,
    openGraph: {
      title: product.name,
      description: description,
      images: product.image_url ? [{ url: getStorageUrl(product.image_url) }] : [],
    },
  };
}

export default function ProductDetails({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetailsBody params={params} />
    </Suspense>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-(--header-h) pb-12 sm:py-20 animate-pulse">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          <div className="aspect-square rounded-3xl bg-slate-100" />
          <div className="mt-8 lg:mt-0 space-y-6">
            <div className="h-10 w-3/4 bg-slate-100 rounded" />
            <div className="h-6 w-1/4 bg-slate-100 rounded" />
            <div className="space-y-3 pt-4">
              {['90%', '81%', '72%', '63%', '45%'].map((width) => (
                <div key={width} className="h-4 bg-slate-100 rounded" style={{ width }} />
              ))}
            </div>
            <div className="h-14 w-56 bg-slate-100 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function ProductDetailsBody({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const product = await getProductDetail(slug);

  if (!product) {
    return notFound();
  }

  const productUrl = `https://catch-22.co.nz/products/${slug}`;
  const price = Number(product.sale_price ?? product.price ?? 0);
  const inStock = product.stock_status === 'instock';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description:
      sanitizeWPContent(
        (product.short_description || product.description || '').replace(/<[^>]*>?/gm, ' ')
      )
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300) || undefined,
    image: product.image_url ? [getStorageUrl(product.image_url)] : undefined,
    sku: String(product.id),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'NZD',
      price: price.toFixed(2),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.catch-22.co.nz/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shop',
        item: 'https://www.catch-22.co.nz/products',
      },
      { '@type': 'ListItem', position: 3, name: product.name, item: productUrl },
    ],
  };

  // Fetch related products from the same category
  interface RelatedProduct {
    id: number;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
    stock_status: string | null;
    product_categories: { category_id: number }[];
  }

  const categoryIds =
    (product.product_categories as { category_id: number }[])?.map((pc) => pc.category_id) || [];

  const relatedProducts: RelatedProduct[] =
    categoryIds.length > 0 ? await getRelatedProducts(product.id, categoryIds) : [];

  return (
    <div className="bg-white min-h-screen">
      <script
        type="application/ld+json"
        // Structured data, not WP content: sanitizeWPContent intentionally not applied
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbLd]) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-(--header-h) pb-12 sm:py-20">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          {/* Image gallery */}
          <div className="flex flex-col">
            <div className="aspect-square rounded-3xl overflow-hidden bg-slate-50 relative border border-slate-100 shadow-inner">
              {product.image_url ? (
                <Image
                  src={getStorageUrl(product.image_url)}
                  alt={product.name}
                  fill
                  className="object-contain"
                  priority
                />
              ) : (
                <div className="bg-slate-100 flex items-center justify-center h-full rounded-3xl">
                  <span className="text-slate-300 font-black uppercase text-xs tracking-widest">
                    No Image
                  </span>
                </div>
              )}
            </div>

            {/* Gallery placeholder if more images existed */}
            {product.gallery_urls &&
              Array.isArray(product.gallery_urls) &&
              product.gallery_urls.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-4">
                  {(product.gallery_urls as string[]).slice(0, 4).map((url: string) => (
                    <div
                      key={url}
                      className="aspect-square relative rounded-xl overflow-hidden bg-slate-50 border border-slate-100"
                    >
                      <Image
                        src={getStorageUrl(url)}
                        alt={`${product.name} gallery image`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
          </div>

          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0 flex flex-col">
            <div className="mb-6">
              <nav className="flex mb-4" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                  <li>
                    <Link href="/products" className="hover:text-primary-ink transition-colors">
                      Gear
                    </Link>
                  </li>
                  <li>
                    <span className="mx-1">/</span>
                  </li>
                  <li className="text-secondary truncate">{product.name}</li>
                </ol>
              </nav>
              <h1 className="text-4xl font-black tracking-tight text-secondary uppercase leading-tight mb-4">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-black text-primary-ink">
                    ${product.price.toFixed(2)}
                  </p>
                  {product.sale_price &&
                    product.regular_price &&
                    (product.regular_price as number) > product.price && (
                      <p className="text-lg font-bold text-slate-400 line-through decoration-primary/40 decoration-2">
                        ${(product.regular_price as number).toFixed(2)}
                      </p>
                    )}
                </div>
                {product.stock_status === 'instock' ? (
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border border-emerald-100">
                    In Stock
                  </span>
                ) : (
                  <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border border-rose-100">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Flexible payment options (Afterpay & Bank Deposit) */}
              {product.price > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
                  <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-1.5">
                    <span className="text-[11px] font-bold text-slate-600">or 4 payments of</span>
                    <span className="text-[11px] font-black text-secondary">
                      ${(product.price / 4).toFixed(2)}
                    </span>
                    <span className="text-[10px] font-black tracking-tight text-secondary bg-[#B2FCE4] px-1.5 py-0.5 rounded-md uppercase">
                      afterpay
                    </span>
                    <AfterpayInfoModal price={product.price} />
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>NZ Internet Banking & Bank Deposit (0% Surcharge)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="prose prose-slate max-w-none">
              <h3 className="text-sm font-black text-secondary uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
                Description
              </h3>
              <div
                className="text-base text-slate-600 leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{
                  __html: sanitizeWPContent(product.description || product.short_description || ''),
                }}
              />
            </div>

            <div className="mt-10 pt-10 border-t border-slate-100 flex flex-col gap-4">
              <AddToCartButton
                product={{
                  ...product,
                  stock_status: product.stock_status || 'instock',
                }}
                variations={
                  (
                    product.product_variations as unknown as {
                      id: number;
                      price: number | null;
                      attributes: Json | null;
                      stock_status: string | null;
                    }[]
                  )?.map((v) => ({
                    id: v.id,
                    price: v.price || 0,
                    attributes: (v.attributes as Record<string, string>) || {},
                    stock_status: v.stock_status,
                  })) || []
                }
              />
              <WishlistButton product={product} showText={true} />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                <span className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">
                  Shipping
                </span>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">
                  Tracked Courier
                </span>
              </div>
              <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                <span className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">
                  Payments
                </span>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">
                  Card · Afterpay · Bank
                </span>
              </div>
              <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                <span className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">
                  Charity
                </span>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">
                  2.5% to Sea Cleaners
                </span>
              </div>
            </div>

            {/* Payment methods reassurance */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center gap-3">
              <PaymentMethodStrip showBankAndEftpos={true} className="justify-center" />
              <NZCheckoutConfidence variant="compact" className="mt-1" />
              <div className="flex flex-col items-center gap-1 mt-1 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  All prices in NZD ($) incl. GST &middot; No card surcharges
                </p>
                <NZPaymentOptionsGuide triggerVariant="link" className="text-[10px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-32 pb-16 border-t border-slate-100 pt-24">
            <div className="flex flex-col items-center mb-16">
              <h2 className="text-4xl font-black tracking-tighter text-secondary uppercase">
                You might also like
              </h2>
              <div className="h-2 w-24 bg-primary mt-4 rounded-full" />
            </div>
            <ProductSlider products={relatedProducts} />
          </div>
        )}
      </div>
    </div>
  );
}
