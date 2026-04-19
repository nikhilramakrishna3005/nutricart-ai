import type { Metadata } from "next";

import { ChatScreen } from "@/components/chat/ChatScreen";
import { AppShell } from "@/components/shared/AppShell";
import { BottomNav } from "@/components/shared/BottomNav";
import { PLANNER_FRAME_MAX } from "@/lib/planner-layout";

export const metadata: Metadata = {
  title: "Chat | NutriCart AI",
  description: "Control center — set preferences, chat with NutriCart AI, and sync your planner dashboard.",
};

export default function ChatPage() {
  return (
    <AppShell
      variant="mobile"
      className="min-h-0 flex-1"
      innerMaxClassName={PLANNER_FRAME_MAX}
      innerClassName="relative flex h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] w-full min-w-0 flex-col overflow-hidden bg-[#0D1117] px-3 text-[#EEF2F7] sm:px-6 lg:px-8"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))]">
        <ChatScreen />
      </div>
      <BottomNav />
    </AppShell>
  );
}
