import { ROUTES, USER_STATUS } from "@/constants";

/** Account created but has not started IB verification yet. */
export function isBrowseOnly(status?: string | null) {
  return !status || status === USER_STATUS.registered;
}

/** User already started (or finished submitting) IB verification. */
export function isVerificationActive(status?: string | null) {
  return (
    status === USER_STATUS.onboarding ||
    status === USER_STATUS.pending_verification ||
    status === USER_STATUS.rejected
  );
}

export function membershipCta(status?: string | null): { label: string; href: string } {
  if (isBrowseOnly(status)) {
    return { label: "Become a member", href: ROUTES.onboarding };
  }
  if (status === USER_STATUS.pending_verification) {
    return { label: "View verification status", href: ROUTES.onboarding };
  }
  if (status === USER_STATUS.rejected) {
    return { label: "Resubmit verification", href: ROUTES.onboarding };
  }
  return { label: "Continue verification", href: ROUTES.onboarding };
}
