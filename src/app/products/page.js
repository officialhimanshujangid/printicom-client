export const metadata = {
  title: 'Shop All Products',
  description: 'Browse our full collection of custom photo products – mugs, calendars, prints, canvas, pillows & more. Filter by category and price.',
};

import { Suspense } from 'react';
import ProductsPageClient from './ProductsPageClient';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading products...</div>}>
      <ProductsPageClient />
    </Suspense>
  );
}
