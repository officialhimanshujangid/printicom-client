'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import ProductCardSkeleton from '@/components/products/ProductCardSkeleton';

const PRODUCT_TYPES = ['mug','calendar','photo_print','canvas_print','pillow','keychain','frame','poster','card','custom'];
const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Newest First' },
  { value: 'discountPrice_asc', label: 'Price: Low to High' },
  { value: 'discountPrice_desc', label: 'Price: High to Low' },
  { value: 'rating.average_desc', label: 'Top Rated' },
];

export default function ProductsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    type: searchParams.get('type') || '',
    minPrice: '',
    maxPrice: '',
    sort: 'createdAt_desc',
  });

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data?.data?.categories || [])).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const [field, order] = filters.sort.split('_');
      const params = new URLSearchParams({ page: pg, limit });
      if (filters.search) params.set('search', filters.search);
      if (filters.category) params.set('category', filters.category);
      if (filters.type) params.set('productType', filters.type);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      params.set('sortBy', field);
      params.set('order', order);
      const { data } = await api.get(`/products?${params}`);
      const list = Array.isArray(data?.data)
        ? data.data
        : (data?.data?.products || []);
      setProducts(list);
      setTotal(data?.pagination?.total || data?.data?.total || list.length || 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { setPage(1); fetchProducts(1); }, [filters.search, filters.category, filters.type, filters.sort]);
  useEffect(() => { fetchProducts(page); }, [page]);

  useEffect(() => {
    const s = searchParams.get('search');
    if (s) setFilters(f => ({ ...f, search: s }));
    const t = searchParams.get('type');
    if (t) setFilters(f => ({ ...f, type: t }));
  }, [searchParams]);

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <div className="section-tag">Collection</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(1.5rem,3vw,2rem)' }}>
            All Products {total > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '1rem' }}>({total})</span>}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 'auto' }} value={filters.sort} onChange={e => setFilter('sort', e.target.value)} aria-label="Sort by">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(f => !f)} aria-expanded={showFilters}>
            <SlidersHorizontal size={15} /> Filters {showFilters ? <X size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <form className="search-bar" style={{ maxWidth: 480, width: '100%' }} onSubmit={e => e.preventDefault()}>
          <input type="search" placeholder="Search products…" value={filters.search} onChange={e => setFilter('search', e.target.value)} aria-label="Search products" />
          <button type="submit" aria-label="Search"><Search size={16} /></button>
        </form>
      </div>

      <div className={showFilters ? 'shop-layout' : ''}>
        {/* Filters */}
        {showFilters && (
          <aside className="filter-sidebar" aria-label="Product filters">
            <h2 className="filter-title">Filters</h2>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="filter-group">
                <div className="filter-group-label">Category</div>
                {categories.map(c => (
                  <div key={c._id} className="filter-option">
                    <input type="radio" id={`cat-${c._id}`} name="category" checked={filters.category === c._id} onChange={() => setFilter('category', filters.category === c._id ? '' : c._id)} />
                    <label htmlFor={`cat-${c._id}`}>{c.name}</label>
                  </div>
                ))}
                {filters.category && <button className="btn btn-ghost btn-sm" onClick={() => setFilter('category', '')} style={{ marginTop: 6, color: 'var(--primary)', fontSize: '0.78rem' }}>Clear</button>}
              </div>
            )}

            {/* Product Type */}
            <div className="filter-group">
              <div className="filter-group-label">Product Type</div>
              {PRODUCT_TYPES.map(t => (
                <div key={t} className="filter-option">
                  <input type="radio" id={`type-${t}`} name="type" checked={filters.type === t} onChange={() => setFilter('type', filters.type === t ? '' : t)} />
                  <label htmlFor={`type-${t}`} style={{ textTransform: 'capitalize' }}>{t.replace('_', ' ')}</label>
                </div>
              ))}
              {filters.type && <button className="btn btn-ghost btn-sm" onClick={() => setFilter('type', '')} style={{ marginTop: 6, color: 'var(--primary)', fontSize: '0.78rem' }}>Clear</button>}
            </div>

            {/* Price */}
            <div className="filter-group">
              <div className="filter-group-label">Price Range (₹)</div>
              <div className="price-range">
                <input type="number" placeholder="Min" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)} min={0} aria-label="Minimum price" />
                <input type="number" placeholder="Max" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)} min={0} aria-label="Maximum price" />
              </div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 10, width: '100%' }} onClick={() => fetchProducts(1)}>Apply</button>
            </div>

            <button className="btn btn-ghost btn-sm" style={{ width: '100%', color: 'var(--text-muted)' }} onClick={() => setFilters({ search: '', category: '', type: '', minPrice: '', maxPrice: '', sort: 'createdAt_desc' })}>
              Clear All Filters
            </button>
          </aside>
        )}

        {/* Grid */}
        <div>
          {filters.search || filters.category || filters.type ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {filters.search && <span className="badge badge-primary">{filters.search} <button onClick={() => setFilter('search', '')} style={{ marginLeft: 4, background: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button></span>}
              {filters.type && <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{filters.type.replace('_',' ')} <button onClick={() => setFilter('type', '')} style={{ marginLeft: 4, background: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button></span>}
            </div>
          ) : null}

          <div className="products-grid">
            {loading
              ? Array.from({ length: limit }).map((_, i) => <ProductCardSkeleton key={i} />)
              : products.length > 0
                ? products.map(p => <ProductCard key={p._id} product={p} />)
                : (
                  <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                    <div className="empty-icon" style={{ fontSize: '2.5rem' }}>🔍</div>
                    <h3 className="empty-title">No products found</h3>
                    <p className="empty-desc">Try different filters or search terms</p>
                    <button className="btn btn-primary" onClick={() => setFilters({ search: '', category: '', type: '', minPrice: '', maxPrice: '', sort: 'createdAt_desc' })}>Clear Filters</button>
                  </div>
                )
            }
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="pagination" aria-label="Products pagination">
              <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1} aria-label="Previous page">←</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)} aria-current={p === page ? 'page' : undefined} aria-label={`Page ${p}`}>{p}</button>
                );
              })}
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages} aria-label="Next page">→</button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
