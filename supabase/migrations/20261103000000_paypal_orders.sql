-- PayPal direct payment support.
-- Stripe stores its references on stripe_session_id / stripe_payment_intent_id;
-- PayPal gets equivalent nullable reference columns plus partial unique indexes
-- so retries and double-clicks can never create duplicate orders.
alter table orders
  add column if not exists paypal_order_id text,
  add column if not exists paypal_capture_id text;

create unique index if not exists orders_paypal_order_id_key
  on orders (paypal_order_id)
  where paypal_order_id is not null;

create unique index if not exists orders_paypal_capture_id_key
  on orders (paypal_capture_id)
  where paypal_capture_id is not null;
