"use client";

import type { ReactNode } from "react";

import type { ChatResponse, MealPlan, Product, Store } from "@/types";

import { mealLoggedHeadline } from "@/components/chat/chatResultSummary";

function sentencesFrom(text: string, max: number): string[] {
  const t = text.trim();
  if (!t) return [];
  const parts = t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length) return parts.slice(0, max);
  return [t.length > 200 ? `${t.slice(0, 197)}…` : t].slice(0, max);
}

function explainBullets(res: ChatResponse): string[] {
  const fromDaily = sentencesFrom(res.dailyInsight, 2);
  if (fromDaily.length >= 2) return fromDaily.slice(0, 2);
  const fromExpl = sentencesFrom(res.explanation, 2);
  const merged = [...fromDaily, ...fromExpl];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of merged) {
    const key = s.slice(0, 48);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= 2) break;
  }
  return out;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mt-3 border-t border-[#2A3A50]/80 pt-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5E7590] first:mt-0 first:border-t-0 first:pt-0">
      {children}
    </p>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="mt-1 text-xs leading-relaxed text-[#5E7590]">Nothing listed for this step yet.</p>;
  }
  return (
    <ul className="mt-1.5 space-y-1.5">
      {items.map((line, i) => (
        <li key={i} className="flex gap-2.5 text-[13px] leading-snug text-[#E5E9F0]">
          <span
            className="mt-2 size-1.5 shrink-0 rounded-full bg-[#4ADE80]/90"
            aria-hidden
          />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

function storeLines(stores: Store[]): string[] {
  return stores.map((s) => {
    const dist = typeof s.distance_miles === "number" ? `${s.distance_miles} mi` : "";
    const hours = s.is_open ? "Open now" : s.opens_at ? `Opens ${s.opens_at}` : "Closed";
    return dist ? `${s.name} · ${dist} · ${hours}` : `${s.name} · ${hours}`;
  });
}

function groceryListLines(res: ChatResponse): string[] {
  const { basket, products } = res;
  if (basket.items.length > 0) {
    return basket.items.map(
      (i) => `${i.name} ×${i.quantity} · $${i.line_total_usd.toFixed(2)}`,
    );
  }
  return products.slice(0, 12).map((p: Product) => `${p.name} · $${p.price_usd.toFixed(2)}`);
}

const MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner"] as const;

function mealSlotLabel(index: number): string {
  if (index < MEAL_SLOTS.length) return MEAL_SLOTS[index];
  return "Another idea";
}

function GroceryPlanBody({ res }: { res: ChatResponse }) {
  const title = res.intent === "refine_plan" ? "Plan updated" : "Grocery plan ready";
  const candidates = res.candidateStores ?? res.stores;
  const stores = storeLines(candidates.slice(0, 4));
  const selected = res.selectedStore;
  const selectedShort = selected?.name?.split("—")[0]?.trim() ?? "";
  const groceries = groceryListLines(res);
  const next =
    res.intent === "refine_plan"
      ? "Open your planner to review changes, or ask for meal ideas from this cart."
      : "Open your planner to see the full dashboard, or ask for meal ideas from this cart.";

  return (
    <>
      <p className="text-[15px] font-bold tracking-tight text-[#EEF2F7]">{title}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#A8B8CC]">{res.message}</p>
      <SectionLabel>Nearby options (up to four)</SectionLabel>
      <BulletList items={stores} />
      {selected ? (
        <>
          <SectionLabel>Selected store</SectionLabel>
          <BulletList
            items={(() => {
              const head = `${selected.name}${
                typeof selected.distance_miles === "number" ? ` · ${selected.distance_miles} mi` : ""
              } · ${selected.is_open ? "Open now" : selected.opens_at ? `Opens ${selected.opens_at}` : "Closed"}`;
              const why = (res.storePickReason ?? "").trim();
              return why ? [head, why] : [head];
            })()}
          />
        </>
      ) : null}
      <SectionLabel>{selectedShort ? `Basket for ${selectedShort}` : "Suggested grocery list"}</SectionLabel>
      <p className="mt-1 text-[12px] leading-snug text-[#5E7590]">
        One-store basket{selectedShort ? ` — everything below is priced for ${selectedShort}.` : "."}
      </p>
      <BulletList items={groceries} />
      <SectionLabel>Next step</SectionLabel>
      <p className="mt-1 text-[13px] leading-relaxed text-[#A8B8CC]">{next}</p>
    </>
  );
}

function MealPlanBody({ res }: { res: ChatResponse }) {
  const plans = res.mealPlan ?? [];
  const next =
    res.explanation?.trim() ||
    "Adjust portions to taste, then log what you eat when you’re done.";

  return (
    <>
      <p className="text-[15px] font-bold tracking-tight text-[#EEF2F7]">Meal plan ready</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#A8B8CC]">{res.message}</p>
      {plans.length === 0 ? (
        <p className="mt-3 text-[13px] leading-relaxed text-[#5E7590]">
          No meal rows came back — try building a grocery plan first, then ask for meal ideas again.
        </p>
      ) : (
        plans.map((mp: MealPlan, index: number) => (
          <div key={mp.id}>
            <SectionLabel>{mealSlotLabel(index)}</SectionLabel>
            <p className="mt-1 text-sm font-semibold text-[#EEF2F7]">{mp.title}</p>
            <BulletList items={(mp.meals ?? []).filter(Boolean)} />
            {mp.notes ? (
              <p className="mt-1.5 text-[11px] leading-snug text-[#5E7590]">{mp.notes}</p>
            ) : null}
          </div>
        ))
      )}
      <SectionLabel>Next step</SectionLabel>
      <p className="mt-1 text-[13px] leading-relaxed text-[#A8B8CC]">{next}</p>
    </>
  );
}

function FoodLogBody({ res, userQuery }: { res: ChatResponse; userQuery?: string }) {
  const title = userQuery ? mealLoggedHeadline(userQuery) : "Meal logged";
  const ns = res.nutritionSummary;
  const loggedItems =
    res.foodLogUpdates?.map((u) => `${u.item} — ${u.action}`) ?? [];

  return (
    <>
      <p className="text-[15px] font-bold tracking-tight text-[#EEF2F7]">{title}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#A8B8CC]">{res.message}</p>
      {loggedItems.length > 0 ? (
        <>
          <SectionLabel>Logged</SectionLabel>
          <BulletList items={loggedItems} />
        </>
      ) : null}
      <SectionLabel>Updated progress</SectionLabel>
      <div className="mt-2 rounded-xl border border-[#2A3A50] bg-[#0D1117]/60 px-3 py-2.5">
        <p className="text-xs font-semibold tabular-nums text-[#EEF2F7]">
          Nutrition score <span className="text-[#4ADE80]">{ns.score}</span>
          <span className="mx-2 text-[#2A3A50]">·</span>
          ~{ns.calories_today} kcal today
        </p>
        <p className="mt-1 text-[11px] leading-snug text-[#5E7590]">
          Protein {Math.round(ns.protein_g)}g · Carbs {Math.round(ns.carbs_g)}g · Fibre{" "}
          {Math.round(ns.fiber_g)}g
        </p>
        {ns.highlights?.length ? (
          <p className="mt-2 text-[12px] leading-relaxed text-[#A8B8CC]">{ns.highlights[0]}</p>
        ) : null}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-[#5E7590]">
        Keep logging small meals so today’s totals stay accurate.
      </p>
    </>
  );
}

function ExplainBody({ res }: { res: ChatResponse }) {
  const bullets = explainBullets(res);
  const fallback = res.message?.trim() ? [res.message] : [];

  return (
    <>
      <p className="text-[15px] font-bold tracking-tight text-[#EEF2F7]">Why this recommendation</p>
      <BulletList items={bullets.length ? bullets : fallback} />
      {bullets.length === 0 && fallback.length === 0 ? (
        <p className="mt-2 text-[13px] text-[#5E7590]">Ask a follow-up for more detail.</p>
      ) : null}
    </>
  );
}

function FallbackBody({ res }: { res: ChatResponse }) {
  return (
    <>
      <p className="text-[15px] font-bold tracking-tight text-[#EEF2F7]">Here’s what changed</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#A8B8CC]">{res.message}</p>
      {res.stores.length > 0 ? (
        <>
          <SectionLabel>Stores</SectionLabel>
          <BulletList items={storeLines(res.stores)} />
        </>
      ) : null}
      {res.basket.items.length > 0 ? (
        <>
          <SectionLabel>Cart highlights</SectionLabel>
          <BulletList items={groceryListLines(res)} />
        </>
      ) : null}
    </>
  );
}

export interface AssistantStructuredMessageProps {
  response: ChatResponse;
  /** Last user message in this turn — used for meal-log titles only. */
  userQuery?: string;
}

/**
 * Rich assistant content from `/chat` fields — no raw JSON, product-style sections.
 */
export function AssistantStructuredMessage({ response, userQuery }: AssistantStructuredMessageProps) {
  const intent = response.intent;

  let body: ReactNode;
  switch (intent) {
    case "plan_groceries":
    case "refine_plan":
      body = <GroceryPlanBody res={response} />;
      break;
    case "generate_meals":
      body = <MealPlanBody res={response} />;
      break;
    case "log_food":
      body = <FoodLogBody res={response} userQuery={userQuery} />;
      break;
    case "explain_plan":
      body = <ExplainBody res={response} />;
      break;
    default:
      body = <FallbackBody res={response} />;
  }

  return <div className="space-y-0.5">{body}</div>;
}
