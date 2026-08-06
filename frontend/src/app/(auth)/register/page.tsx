"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { register as registerUser } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { ROUTES } from "@/constants";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { ThemeToggle } from "@/components/common/ThemeToggle";

const schema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  password: z.string().min(8, "Min 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const res = await registerUser(values);
      if (!res.success || !res.data) {
        setError(res.message || "Registration failed");
        return;
      }
      setSession(res.data.user, res.data.tokens.access_token, res.data.tokens.refresh_token);
      router.push(ROUTES.member);
    } catch {
      setError("Could not register. Email may already be in use.");
    }
  });

  return (
    <div className="surface-panel relative p-7 md:p-8">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Create account</h1>
      <p className="mt-2 text-sm text-muted">
        Explore the desk first. Start IB verification only when you want full member access.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Full name</span>
          <input className="field-input" autoComplete="name" {...register("full_name")} />
          {errors.full_name ? <span className="text-[var(--danger)]">{errors.full_name.message}</span> : null}
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Email</span>
          <input type="email" className="field-input" autoComplete="email" {...register("email")} />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Password</span>
          <PasswordInput autoComplete="new-password" {...register("password")} />
          {errors.password ? <span className="text-[var(--danger)]">{errors.password.message}</span> : null}
        </label>
        {error ? (
          <p className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
          {isSubmitting ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
