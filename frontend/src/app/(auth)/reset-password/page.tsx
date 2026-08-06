"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { resetPassword } from "@/services/auth";
import { ROUTES } from "@/constants";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { ThemeToggle } from "@/components/common/ThemeToggle";

const schema = z.object({
  token: z.string().min(10),
  new_password: z.string().min(8),
});

export default function ResetPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const res = await resetPassword(values.token, values.new_password);
      setMessage(res.message);
    } catch {
      setError("Invalid or expired token");
    }
  });

  return (
    <div className="surface-panel relative p-7 md:p-8">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Reset password</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Token</span>
          <input className="field-input" {...register("token")} />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">New password</span>
          <PasswordInput autoComplete="new-password" {...register("new_password")} />
        </label>
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {message ? <p className="text-sm text-accent">{message}</p> : null}
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
          Update password
        </button>
      </form>
      <Link href={ROUTES.login} className="mt-6 inline-block text-sm text-muted hover:text-accent">
        Back to login
      </Link>
    </div>
  );
}
