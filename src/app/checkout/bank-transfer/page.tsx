'use client';

import { ArrowLeft, Banknote, CheckCircle, Copy, Loader2, Printer } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { type BankTransferSuccess, createBankTransferOrder } from '@/app/checkout/actions';
import { SHIPPING_RATES } from '@/config/shipping';
import { useCartStore } from '@/lib/store/cart';

/** No-op store subscription: hydration state never changes after mount. */
const emptySubscribe = () => () => {};

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — please select the text manually.');
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-secondary transition-colors"
      aria-label={`Copy ${label}`}
    >
      <Copy size={14} strokeWidth={2.5} />
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function SuccessPanel({ result }: { result: BankTransferSuccess }) {
  return (
    <div className="min-h-[80vh] bg-white pt-(--header-h) pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 sm:p-12 shadow-sm">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle className="w-10 h-10 text-emerald-600" strokeWidth={3} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-secondary uppercase tracking-tight mb-3">
              Order reserved
            </h1>
            <p className="text-slate-600 font-medium max-w-md leading-relaxed">
              Thanks! Your gear is set aside. Complete the bank transfer below and we&apos;ll get it
              packed as soon as the payment clears.
            </p>
            <div className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
              <span className="text-emerald-600 text-lg">🌊</span>
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                2.5% of this order goes to NZ Sea Cleaners
              </span>
            </div>
          </div>

          {result.bank.testMode && (
            <div
              role="status"
              className="mb-8 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl font-bold text-xs uppercase tracking-wider text-center"
            >
              Test mode — these bank details are placeholders. Do not send money.
            </div>
          )}

          {/* Reference + amount */}
          <div className="bg-secondary rounded-2xl p-6 sm:p-8 mb-6 print:bg-white print:border print:border-slate-200">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 print:text-slate-500">
                  Payment reference
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-black text-primary tracking-tight break-all print:text-secondary">
                    {result.reference}
                  </p>
                  <CopyButton value={result.reference} label="payment reference" />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 print:text-slate-500">
                  Amount to pay
                </p>
                <p className="text-2xl font-black text-white tracking-tight print:text-secondary">
                  {money(result.totals.total)} NZD
                </p>
              </div>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-8 shadow-xs">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
              Order cost breakdown
            </h3>
            <div className="space-y-2 text-xs font-bold text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-secondary">{money(result.totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-secondary">
                  {result.totals.shipping === 0 ? 'Free' : money(result.totals.shipping)}
                </span>
              </div>
              {result.totals.discount > 0 && (
                <div className="flex justify-between text-primary-ink font-black">
                  <span>Discount</span>
                  <span>-{money(result.totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-slate-100 text-sm font-black text-secondary">
                <span className="uppercase tracking-widest text-[11px]">Total due</span>
                <span className="text-lg text-primary-ink tabular-nums">
                  {money(result.totals.total)} NZD
                </span>
              </div>
            </div>
          </div>

          {/* Bank details */}
          <section aria-labelledby="bank-details-heading" className="mb-8">
            <h2
              id="bank-details-heading"
              className="text-sm font-black text-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2"
            >
              <Banknote size={18} className="text-primary-ink" strokeWidth={2.5} />
              Bank transfer details
            </h2>
            <dl className="divide-y divide-slate-200 border-y border-slate-200">
              <div className="flex items-baseline justify-between gap-4 py-4">
                <dt className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Bank
                </dt>
                <dd className="text-sm font-black text-secondary text-right">
                  {result.bank.bankName}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-4">
                <dt className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Account name
                </dt>
                <dd className="text-sm font-black text-secondary text-right">
                  {result.bank.accountName}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-4">
                <dt className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Account number
                </dt>
                <dd className="flex items-center gap-3">
                  <span className="text-lg font-black text-secondary tracking-tight">
                    {result.bank.accountNumber}
                  </span>
                  <CopyButton value={result.bank.accountNumber} label="account number" />
                </dd>
              </div>
            </dl>
          </section>

          {/* Instructions */}
          <section aria-labelledby="instructions-heading" className="mb-10">
            <h2
              id="instructions-heading"
              className="text-sm font-black text-secondary uppercase tracking-[0.2em] mb-4"
            >
              What happens next
            </h2>
            <ol className="space-y-3">
              {result.bank.instructions.map((instruction, index) => (
                <li key={instruction} className="flex gap-3 text-sm text-slate-600 font-medium">
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-primary/30 text-secondary text-[10px] font-black flex items-center justify-center">
                    {index + 1}
                  </span>
                  {instruction}
                </li>
              ))}
            </ol>
          </section>

          <div className="flex flex-col sm:flex-row gap-3 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-secondary text-white rounded-full py-4 px-6 text-xs font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-secondary transition-all"
            >
              <Printer size={16} strokeWidth={2.5} />
              Print instructions
            </button>
            <Link
              href="/products"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-secondary rounded-full py-4 px-6 text-xs font-black uppercase tracking-[0.2em] hover:bg-primary-dark transition-all"
            >
              Continue shopping
            </Link>
          </div>

          <p className="mt-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Keep this page or print these instructions for your records.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-secondary transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Back to cart
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Skeleton shared by the pre-hydration paint and the Suspense fallback. */
function CheckoutSkeleton() {
  return (
    <div className="bg-white min-h-screen pt-(--header-h) pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
        <div className="h-10 w-64 bg-slate-100 rounded mb-8" />
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 h-96 bg-slate-50 rounded-3xl" />
          <div className="lg:col-span-5 h-64 bg-slate-50 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

// Inner component (uses useSearchParams — must be wrapped in Suspense)
function BankTransferCheckout() {
  const { items, totalPrice, clearCart } = useCartStore();
  const [shippingMethodId, setShippingMethodId] = useState('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<BankTransferSuccess | null>(null);

  // The cart links here with an already-validated promo (?promo=CODE). Pre-fill
  // the field so the customer doesn't re-type it; the server action re-validates
  // at submit, so a stale or hand-crafted param simply fails there.
  const promoParam = (useSearchParams().get('promo') ?? '').trim();

  // Persisted cart rehydrates client-side only; render the skeleton on the
  // server/first paint to avoid an empty-cart mismatch flash.
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const shippingRate = SHIPPING_RATES.find((rate) => rate.id === shippingMethodId);
  const estimatedTotal = totalPrice() + (shippingRate ? shippingRate.amount / 100 : 0);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const field = (name: string) => String(formData.get(name) ?? '').trim();

    try {
      const response = await createBankTransferOrder({
        items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
        customer: {
          firstName: field('firstName'),
          lastName: field('lastName'),
          email: field('email'),
          phone: field('phone'),
          address1: field('address1'),
          address2: field('address2'),
          city: field('city'),
          postcode: field('postcode'),
          region: field('region'),
        },
        shippingMethodId,
        promoCode: field('promoCode'),
      });

      if ('error' in response) {
        setErrorMessage(response.error);
        return;
      }

      setResult(response);
      clearCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setErrorMessage('Could not place your order — check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success must be checked before the empty-cart guard: the cart is cleared
  // as soon as the order is created.
  if (result) return <SuccessPanel result={result} />;

  if (!hydrated) {
    return <CheckoutSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="bg-white min-h-[70vh] flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-4xl font-black text-secondary uppercase tracking-tight mb-6">
          Your Cart is Empty
        </h1>
        <p className="text-slate-500 font-medium mb-10 max-w-sm">
          Add some gear to your cart before choosing bank transfer.
        </p>
        <Link
          href="/products"
          className="inline-block bg-primary hover:bg-primary-dark text-secondary font-black py-4 px-10 rounded-full transition-all uppercase tracking-widest text-sm shadow-xl shadow-primary/20"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-(--header-h) pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-secondary transition-colors mb-4 w-fit"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Back to cart
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-secondary uppercase">
            Bank Transfer Checkout
          </h1>
          <div className="h-1.5 w-24 bg-primary mt-3" />
          <p className="mt-4 text-slate-500 font-medium max-w-2xl">
            No card required. Place your order and we&apos;ll show you our bank details — your gear
            is reserved once the order is placed.
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-10">
            <fieldset className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8">
              <legend className="px-2 text-sm font-black text-secondary uppercase tracking-[0.2em]">
                Your details
              </legend>
              <div className="grid gap-5 sm:grid-cols-2 mt-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                  >
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    autoComplete="given-name"
                    maxLength={100}
                    className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                  >
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    autoComplete="family-name"
                    maxLength={100}
                    className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    maxLength={254}
                    className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                  >
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    maxLength={30}
                    className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8">
              <legend className="px-2 text-sm font-black text-secondary uppercase tracking-[0.2em]">
                Shipping address
              </legend>
              <div className="grid gap-5 mt-4">
                <div>
                  <label
                    htmlFor="address1"
                    className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                  >
                    Address
                  </label>
                  <input
                    id="address1"
                    name="address1"
                    type="text"
                    required
                    autoComplete="address-line1"
                    maxLength={200}
                    className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label
                    htmlFor="address2"
                    className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                  >
                    Address line 2 <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    id="address2"
                    name="address2"
                    type="text"
                    autoComplete="address-line2"
                    maxLength={200}
                    className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                    >
                      City / suburb
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      autoComplete="address-level2"
                      maxLength={100}
                      className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="region"
                      className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                    >
                      Region <span className="text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="region"
                      name="region"
                      type="text"
                      autoComplete="address-level1"
                      maxLength={100}
                      className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="postcode"
                      className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                    >
                      Postcode
                    </label>
                    <input
                      id="postcode"
                      name="postcode"
                      type="text"
                      required
                      autoComplete="postal-code"
                      maxLength={20}
                      className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            <fieldset className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8">
              <legend className="px-2 text-sm font-black text-secondary uppercase tracking-[0.2em]">
                Shipping method
              </legend>
              <div className="space-y-3 mt-4">
                {SHIPPING_RATES.map((rate) => (
                  <label
                    key={rate.id}
                    className={`flex items-center justify-between gap-4 cursor-pointer rounded-2xl border px-5 py-4 transition-all ${
                      shippingMethodId === rate.id
                        ? 'border-primary bg-white shadow-sm'
                        : 'border-slate-200 bg-white/60 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={rate.id}
                        checked={shippingMethodId === rate.id}
                        onChange={() => setShippingMethodId(rate.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm font-bold text-secondary">{rate.name}</span>
                    </span>
                    <span className="text-sm font-black text-secondary whitespace-nowrap">
                      {rate.displayPrice}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="promoCode"
                className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
              >
                Promo code <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="promoCode"
                name="promoCode"
                type="text"
                defaultValue={promoParam}
                maxLength={50}
                placeholder="ENTER CODE"
                className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
              />
              <p className="mt-2 ml-1 text-[10px] text-slate-400 font-medium">
                Discounts are applied when you place the order.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl font-bold text-sm"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-secondary text-white rounded-full py-5 px-6 text-sm font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-secondary transition-all shadow-xl shadow-secondary/10 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-3 animate-spin" size={20} strokeWidth={3} />
                  Reserving your order…
                </>
              ) : (
                <>
                  Place Order — Pay by Bank Transfer
                  <Banknote className="ml-3" size={20} strokeWidth={3} />
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              No payment is taken now — you&apos;ll receive bank details next.
            </p>
          </form>

          {/* Summary */}
          <aside className="mt-12 lg:mt-0 lg:col-span-5">
            <div className="bg-slate-50 rounded-3xl px-6 py-8 sm:p-8 border border-slate-100 shadow-sm sticky top-24">
              <h2 className="text-xl font-black text-secondary uppercase tracking-widest mb-6 border-b-2 border-primary pb-2 inline-block">
                Order Summary
              </h2>

              <ul className="divide-y divide-slate-200">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-secondary uppercase leading-tight truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-black text-secondary whitespace-nowrap">
                      {money(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <dl className="mt-6 space-y-4 border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between">
                  <dt className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Subtotal
                  </dt>
                  <dd className="text-sm font-black text-secondary">{money(totalPrice())}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Shipping
                  </dt>
                  <dd className="text-sm font-black text-secondary">
                    {shippingRate ? shippingRate.displayPrice : '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <dt className="text-lg font-black text-secondary uppercase tracking-tight">
                    Estimated total
                  </dt>
                  <dd className="text-2xl font-black text-primary-ink tracking-tighter">
                    {money(estimatedTotal)}
                  </dd>
                </div>
              </dl>

              <p className="mt-4 text-[10px] text-slate-400 font-medium leading-relaxed">
                Promo codes are applied when you place the order. The final amount is shown on the
                confirmation screen.
              </p>

              <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-6">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Your order is reserved until payment clears
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// Public export — Suspense required for useSearchParams in App Router
export default function BankTransferCheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <BankTransferCheckout />
    </Suspense>
  );
}
