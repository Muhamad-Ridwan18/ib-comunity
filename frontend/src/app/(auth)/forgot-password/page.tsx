"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { forgotPassword } from "@/services/auth";
import { ROUTES } from "@/constants";
import { ThemeToggle } from "@/components/common/ThemeToggle";

const schema = z.object({ email: z.string().email() });

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<{ email: string }>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ email }) => {
    const res = await forgotPassword(email);
    setMessage(res.message);
    setDevToken(res.data?.dev_reset_token ?? null);
  });

  return (
    <div className="surface-panel relative p-7 md:p-8">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Forgot password</h1>
      <p className="mt-2 text-sm text-muted">Enter your email to generate a reset token.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Email</span>
          <input type="email" className="field-input" autoComplete="email" {...register("email")} />
        </label>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
          Send reset
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
      {devToken ? (
        <p className="mt-2 break-all text-xs text-accent">
          Dev token: {devToken} — use on{" "}
          <Link href={ROUTES.resetPassword} className="underline">
            reset page
          </Link>
        </p>
      ) : null}
      <Link href={ROUTES.login} className="mt-6 inline-block text-sm text-muted hover:text-accent">
        Back to login
      </Link>
    </div>
  );
}
