'use client';

import { useCartStore } from '@/lib/store/cart';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({ id: item.id, quantity: item.quantity, name: item.name, price: item.price })),
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Something went wrong');
      }
    } catch (error) {
      alert('Checkout failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Your Cart is Empty</h1>
        <p className="text-slate-500 mb-8">Looks like you haven't added any gear yet.</p>
        <Link 
          href="/products"
          className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:text-lg"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-8">Shopping Cart</h1>

      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
        <div className="lg:col-span-8">
          <ul className="border-t border-b border-slate-200 divide-y divide-slate-200">
            {items.map((item) => (
              <li key={item.id} className="flex py-6 sm:py-10">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-200 rounded-md object-center object-cover relative overflow-hidden">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Image</div>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
                  <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-sm">
                          <Link href={`/products/${item.slug}`} className="font-medium text-slate-700 hover:text-slate-800">
                            {item.name}
                          </Link>
                        </h3>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-900">${item.price.toFixed(2)}</p>
                    </div>

                    <div className="mt-4 sm:mt-0 sm:pr-9">
                      <div className="flex items-center border border-slate-300 rounded-md w-min">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="p-2 text-slate-600 hover:text-slate-900"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-4 text-sm font-medium text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 text-slate-600 hover:text-slate-900"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="absolute top-0 right-0">
                        <button
                          type="button"
                          className="-m-2 p-2 inline-flex text-slate-400 hover:text-slate-500"
                          onClick={() => removeItem(item.id)}
                        >
                          <span className="sr-only">Remove</span>
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Order summary */}
        <section className="mt-16 bg-slate-50 rounded-lg px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-4 border border-slate-100">
          <h2 className="text-lg font-medium text-slate-900">Order summary</h2>

          <dl className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-slate-600">Subtotal</dt>
              <dd className="text-sm font-medium text-slate-900">${totalPrice().toFixed(2)}</dd>
            </div>
            <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
              <dt className="text-base font-medium text-slate-900">Order total</dt>
              <dd className="text-base font-medium text-slate-900">${totalPrice().toFixed(2)}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex justify-center items-center disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Proceed to Checkout'}
              {!isLoading && <ArrowRight className="ml-2" size={20} />}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}