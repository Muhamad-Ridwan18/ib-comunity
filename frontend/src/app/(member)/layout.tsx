"use client";

import { MemberShell } from "@/components/layout/MemberShell";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <MemberShell>{children}</MemberShell>;
}
