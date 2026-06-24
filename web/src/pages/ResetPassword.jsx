import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "../api/axios";
import AuthShell from "../components/AuthShell";
import { resetPasswordSchema } from "../validation/schemas";

const fieldClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [complete, setComplete] = useState(false);
  const [show, setShow] = useState(false);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const submit = async ({ password }) => {
    if (!token) {
      setError("root.server", { message: "This reset link is missing or invalid. Request a new one." });
      return;
    }
    try {
      await API.post("/auth/reset-password", { token, password });
      setComplete(true);
    } catch (error) {
      const fields = error.response?.data?.fieldErrors;
      if (fields?.password) setError("password", { message: fields.password });
      else setError("root.server", { message: error.response?.data?.message || "We could not reset your password. Request a new link." });
    }
  };

  return (
    <AuthShell eyebrow="Secure password reset" title={complete ? "Password updated" : "Choose a new password"} description={complete ? "Your account is secure and ready to use." : "Create a strong password you have not used for this account."} footer={complete ? null : <>Need another link? <Link to="/forgot-password" className="font-bold text-blue-600 hover:text-blue-700">Request one</Link></>}>
      {complete ? (
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl font-black text-emerald-600">✓</span>
          <p className="mt-5 text-sm leading-6 text-slate-500">Your password was reset successfully. All password-reset links for this account are now invalid.</p>
          <Link to="/login" className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20">Continue to sign in</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">New password</span><div className="relative"><input {...register("password")} type={show ? "text" : "password"} autoComplete="new-password" placeholder="At least 8 characters" className={fieldClass + " pr-20"} /><button type="button" onClick={() => setShow((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-200">{show ? "Hide" : "Show"}</button></div>{errors.password && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.password.message}</p>}</label>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Confirm new password</span><input {...register("confirmPassword")} type={show ? "text" : "password"} autoComplete="new-password" placeholder="Repeat your new password" className={fieldClass} />{errors.confirmPassword && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.confirmPassword.message}</p>}</label>
          {errors.root?.server && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errors.root.server.message}</div>}
          <button disabled={isSubmitting || !token} className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60">{isSubmitting ? "Updating password..." : "Reset password"}</button>
        </form>
      )}
    </AuthShell>
  );
}

export default ResetPassword;
