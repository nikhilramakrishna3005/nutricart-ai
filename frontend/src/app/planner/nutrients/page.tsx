import { PlannerShell } from "@/components/planner/PlannerShell";
import { NutrientDetailPage } from "@/components/planner/nutrients/NutrientDetailPage";
import { AppShell } from "@/components/shared/AppShell";
import { PLANNER_FRAME_MAX } from "@/lib/planner-layout";

export const metadata = {
  title: "Nutrient Breakdown | NutriCart AI",
};

export default function NutrientsPage() {
  return (
    <AppShell variant="dashboard" innerMaxClassName={PLANNER_FRAME_MAX}>
      <PlannerShell>
        <NutrientDetailPage />
      </PlannerShell>
    </AppShell>
  );
}
