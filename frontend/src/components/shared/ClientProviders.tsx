"use client";

import type { ReactNode } from "react";

import { UserProfileProvider } from "@/context/UserProfileContext";

export function ClientProviders({ children }: { children: ReactNode }) {
  return <UserProfileProvider>{children}</UserProfileProvider>;
}
