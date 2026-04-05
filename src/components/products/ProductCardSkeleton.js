export default function ProductCardSkeleton() {
  return (
    <div className="product-card" style={{ pointerEvents: 'none' }}>
      <div className="product-card-img skeleton" style={{ aspectRatio: 1 }} />
      <div className="product-card-body">
        <div className="skeleton" style={{ height: 14, borderRadius: 6, marginBottom: 8, width: '85%' }} />
        <div className="skeleton" style={{ height: 12, borderRadius: 6, marginBottom: 12, width: '55%' }} />
        <div className="skeleton" style={{ height: 18, borderRadius: 6, width: '45%' }} />
      </div>
    </div>
  );
}
