import { BottomNav } from "@/components/shared/BottomNav";

/**
 * Shared app chrome for dashboard routes (fixed bottom nav).
 * App shell is applied per page in `page.tsx` files.
 */
export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
