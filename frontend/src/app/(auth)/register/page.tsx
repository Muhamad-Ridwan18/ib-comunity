"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { TermsAcceptanceFields } from "@/components/auth/TermsAcceptanceFields";
import { register as registerUser } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { ROUTES } from "@/constants";
import { NEW_MEMBER_FLAG } from "@/lib/auth-routing";
import { track } from "@/lib/analytics";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LocaleToggle } from "@/components/common/LocaleToggle";
import { useT } from "@/i18n/useT";

const requiredCheck = (message: string) => z.boolean().refine((v) => v === true, { message });

const schema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  password: z.string().min(8, "Min 8 characters"),
  terms_agree_docs: requiredCheck("Required"),
  terms_age_capacity: requiredCheck("Required"),
  terms_risk_release: requiredCheck("Required"),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { t } = useT();
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      terms_agree_docs: false,
      terms_age_capacity: false,
      terms_risk_release: false,
    },
  });

  const termsAccepted =
    watch("terms_agree_docs") === true &&
    watch("terms_age_capacity") === true &&
    watch("terms_risk_release") === true;

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const res = await registerUser({
        email: values.email,
        password: values.password,
        full_name: values.full_name,
        accept_terms: true,
      });
      if (!res.success || !res.data) {
        setError(res.message || t("auth.registerFailed"));
        return;
      }
      setSession(res.data.user, res.data.tokens.access_token, res.data.tokens.refresh_token);
      sessionStorage.setItem(NEW_MEMBER_FLAG, "1");
      track("signup_complete", { status: res.data.user.status });
      router.push(ROUTES.member);
    } catch {
      setError(t("auth.registerError"));
    }
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-7 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_100%_0%,var(--glow),transparent_55%)]" />
      <div className="relative">
        <div className="absolute right-0 top-0 flex items-center gap-1.5">
          <LocaleToggle />
          <ThemeToggle />
        </div>
        <h1 className="font-display pr-28 text-3xl font-semibold tracking-tight">{t("auth.createAccount")}</h1>
        <p className="mt-2 text-sm text-muted">{t("auth.createAccountBody")}</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">{t("auth.fullName")}</span>
            <input className="field-input" autoComplete="name" {...register("full_name")} />
            {errors.full_name ? <span className="text-[var(--danger)]">{errors.full_name.message}</span> : null}
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">{t("auth.email")}</span>
            <input type="email" className="field-input" autoComplete="email" {...register("email")} />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">{t("auth.password")}</span>
            <PasswordInput autoComplete="new-password" {...register("password")} />
            {errors.password ? <span className="text-[var(--danger)]">{errors.password.message}</span> : null}
          </label>

          <TermsAcceptanceFields register={register} errors={errors} />

          {error ? (
            <p className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={isSubmitting || !termsAccepted} className="btn-primary w-full py-3 disabled:opacity-50">
            {isSubmitting ? t("auth.creating") : t("auth.createAccount")}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          {t("auth.alreadyHave")}{" "}
          <Link href={ROUTES.login} className="text-accent hover:underline">
            {t("auth.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
