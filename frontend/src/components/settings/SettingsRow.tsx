import {
  Bell,
  ChartColumn,
  ChevronRight,
  HelpCircle,
  Info,
  Leaf,
  Lock,
  MapPin,
  MapPinned,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Store,
  Target,
  Trophy,
  User,
  Users,
  Wallet,
} from "lucide-react";

import type { SettingsIconKey } from "@/data/mockSettings";

import { cn } from "@/lib/utils";

const iconMap: Record<SettingsIconKey, typeof User> = {
  user: User,
  leaf: Leaf,
  shieldAlert: ShieldAlert,
  target: Target,
  mapPin: MapPin,
  chartColumn: ChartColumn,
  sparkles: Sparkles,
  wallet: Wallet,
  store: Store,
  users: Users,
  trophy: Trophy,
  bell: Bell,
  shoppingCart: ShoppingCart,
  lock: Lock,
  mapPinned: MapPinned,
  helpCircle: HelpCircle,
  info: Info,
};

export interface SettingsRowProps {
  icon: SettingsIconKey;
  label: string;
  /** Optional preview of the saved value (e.g. after editing in the settings modal). */
  subtitle?: string;
  onPress?: () => void;
}

export function SettingsRow({ icon, label, subtitle, onPress }: SettingsRowProps) {
  const Icon = iconMap[icon];

  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border border-[#2A3A50] bg-[#131C2A] px-3 py-3 text-left transition-colors",
        "hover:border-[#3d4f66] hover:bg-[#161f2e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1117]",
        "sm:px-4 sm:py-3.5",
      )}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#1A2333] text-[#5E7590]"
        aria-hidden
      >
        <Icon className="size-[18px]" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold tracking-tight text-[#EEF2F7] sm:text-base">{label}</span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-xs font-normal leading-snug text-[#5E7590]">{subtitle}</span>
        ) : null}
      </span>
      <ChevronRight className="size-4 shrink-0 text-[#5E7590]" strokeWidth={2} aria-hidden />
    </button>
  );
}
