import { ROUTES } from "@/constants";

export type MemberNavItem = {
  href: string;
  labelKey: string;
  exact?: boolean;
  /** Locked until MT5 verification is approved. */
  locked?: boolean;
};

export const memberNav: MemberNavItem[] = [
  { href: ROUTES.member, labelKey: "nav.home", exact: true },
  { href: ROUTES.verification, labelKey: "member.verification" },
  { href: ROUTES.psychology, labelKey: "member.psychology", locked: true },
  { href: ROUTES.analysis, labelKey: "member.technical", locked: true },
  { href: ROUTES.signals, labelKey: "nav.signals", locked: true },
  { href: ROUTES.compounding, labelKey: "member.compounding", locked: true },
  { href: ROUTES.calendar, labelKey: "member.calendar", locked: true },
  { href: ROUTES.tools, labelKey: "member.tools", locked: true },
];
