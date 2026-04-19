import { SectionCard } from "@/components/shared/SectionCard";
import type { GroceryBasket } from "@/types";

interface GroceryBasketSectionProps {
  basket?: GroceryBasket | null;
  loading?: boolean;
}

export function GroceryBasketSection({ basket, loading }: GroceryBasketSectionProps) {
  return (
    <SectionCard
      title="Grocery basket"
      description="Suggested cart built from recommended products (mock totals)."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading basket…</p>
      ) : !basket || basket.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Basket appears after you generate a plan.</p>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2 text-sm">
            {basket.items.map((i) => (
              <li key={i.product_id} className="flex justify-between gap-4 border-b pb-2 last:border-0">
                <span>
                  {i.name}{" "}
                  <span className="text-muted-foreground">×{i.quantity}</span>
                </span>
                <span className="shrink-0">${i.line_total_usd.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <p className="text-right text-sm font-medium">Subtotal: ${basket.subtotal_usd.toFixed(2)}</p>
        </div>
      )}
    </SectionCard>
  );
}
