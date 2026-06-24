import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "../api/axios";
import AuthShell from "../components/AuthShell";
import { forgotPasswordSchema } from "../validation/schemas";

const fieldClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

function ForgotPassword() {
  const [result, setResult] = useState(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const submit = async (values) => {
    try {
      const { data } = await API.post("/auth/forgot-password", values);
      setResult(data);
    } catch (error) {
      setError("root.server", { message: error.response?.data?.message || "We could not process your request. Please try again." });
    }
  };

  return (
    <AuthShell eyebrow="Account recovery" title="Forgot your password?" description="Enter your account email and we will send a secure link to choose a new password." footer={<>Remembered it? <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700">Back to sign in</Link></>}>
      {result ? (
        <div className="space-y-5">
          <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-lg font-black text-white">✓</span>
            <h2 className="mt-4 font-bold">Check your email</h2>
            <p className="mt-1 text-sm leading-6">{result.message}</p>
          </div>
          {result.developmentResetUrl && <a href={result.developmentResetUrl} className="block rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-800">Open development reset link</a>}
          <p className="text-center text-xs leading-5 text-slate-400">The link expires after 15 minutes. Check your spam folder if it does not arrive.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Email address</span>
            <input {...register("email")} type="email" autoComplete="email" placeholder="you@example.com" className={fieldClass} autoFocus />
            {errors.email && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.email.message}</p>}
          </label>
          {errors.root?.server && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errors.root.server.message}</div>}
          <button disabled={isSubmitting} className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60">{isSubmitting ? "Sending secure link..." : "Send reset link"}</button>
        </form>
      )}
    </AuthShell>
  );
}

export default ForgotPassword;
