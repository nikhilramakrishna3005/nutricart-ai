import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/shared/SectionCard";
import type { Product } from "@/types";

interface RecommendedProductsSectionProps {
  products: Product[];
  loading?: boolean;
}

export function RecommendedProductsSection({ products, loading }: RecommendedProductsSectionProps) {
  return (
    <SectionCard
      title="Recommended products"
      description="Per-store picks with mock price and stock — aligns with basket below."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products yet. Generate a plan first.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {products.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-muted-foreground">{p.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <span>${p.price_usd.toFixed(2)}</span>
                <Badge variant={p.in_stock ? "outline" : "secondary"}>
                  {p.in_stock ? "In stock" : "Low stock"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
