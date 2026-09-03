"use client";

import Link from "next/link";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { termsAndConditions } from "@/content/terms-and-conditions";
import { ROUTES } from "@/constants";
import { useT } from "@/i18n/useT";

type TermsFormValues = {
  terms_agree_docs: boolean;
  terms_age_capacity: boolean;
  terms_risk_release: boolean;
};

type TermsAcceptanceFieldsProps = {
  register: UseFormRegister<TermsFormValues>;
  errors: FieldErrors<TermsFormValues>;
};

export function TermsAcceptanceFields({ register, errors }: TermsAcceptanceFieldsProps) {
  const { locale, t } = useT();
  const c = termsAndConditions[locale === "id" ? "id" : "en"];

  const fields: { name: keyof TermsFormValues; label: string }[] = [
    { name: "terms_agree_docs", label: c.declarations[0] },
    { name: "terms_age_capacity", label: c.declarations[1] },
    { name: "terms_risk_release", label: c.declarations[2] },
  ];

  const hasError = Boolean(errors.terms_agree_docs || errors.terms_age_capacity || errors.terms_risk_release);

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">{t("auth.termsTitle")}</p>
        <Link href={ROUTES.terms} target="_blank" className="shrink-0 text-xs font-medium text-accent hover:underline">
          {t("auth.termsReadFull")}
        </Link>
      </div>

      <div className="max-h-40 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-xs leading-relaxed text-muted">
        <p className="font-medium text-[var(--foreground)]">{c.pageTitle}</p>
        <p className="mt-2">{c.intro}</p>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <label key={field.name} className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 accent-[var(--accent)]"
              {...register(field.name, { required: true })}
            />
            <span className="leading-relaxed text-muted">
              <span className="font-medium text-[var(--foreground)]">
                {locale === "id" ? `Poin ${index + 1}:` : `Point ${index + 1}:`}
              </span>{" "}
              {field.label}
            </span>
          </label>
        ))}
      </div>

      {hasError ? <p className="text-xs text-[var(--danger)]">{c.checkboxRequired}</p> : null}
    </div>
  );
}
