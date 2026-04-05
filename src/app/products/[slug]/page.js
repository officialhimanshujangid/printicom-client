import api from '@/lib/api';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

async function getProduct(slug) {
  try { const r = await api.get(`/products/slug/${slug}`); return r.data?.data?.product || null; }
  catch { return null; }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product Not Found' };
  return {
    title: product.name,
    description: product.shortDescription || product.description?.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: product.thumbnailImage ? [{ url: product.thumbnailImage }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return <ProductDetailClient product={product} />;
}
