# Catch-22 Next Documentation

This directory contains documentation for the Catch-22 Next project, a migration from WooCommerce to Next.js and Supabase.

## Project Structure

- `supabase/`: Contains Supabase configuration and migrations.
- `src/`: Main application code.
  - `app/`: Next.js App Router pages.
  - `components/`: React components.
  - `lib/`: Shared libraries and utilities.
- `docs/`: Project documentation.

## Database Schema

The database schema is managed via Supabase migrations located in `supabase/migrations`.
Key tables include:
- `products`: Core product information.
- `categories`: Product categories.
- `product_categories`: Many-to-many relationship between products and categories.
- `profiles`: User profiles (migrated from WordPress).
- `orders`: Customer orders.
- `order_items`: Items within each order.
