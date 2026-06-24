import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "../api/axios";
import AuthShell from "../components/AuthShell";
import { loginSchema } from "../validation/schemas";

const fieldClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";
const FieldError = ({ error }) => error ? <p className="mt-1.5 text-xs font-medium text-rose-600">{error.message}</p> : null;

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (form) => {
    try {
      const res = await API.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err) {
      const fields = err.response?.data?.fieldErrors;
      if (fields) Object.entries(fields).forEach(([field, message]) => setError(field, { message }));
      else setError("root.server", { message: err.response?.data?.message || "Login failed. Please try again." });
    }
  };

  return (
    <AuthShell eyebrow="Welcome back" title="Sign in to your account" description="Enter your details to manage bookings and plan your next ride." footer={<>New to CarBooking? <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700">Create an account</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Email address</span><input {...register("email")} type="email" placeholder="you@example.com" className={fieldClass} autoComplete="email" /><FieldError error={errors.email} /></label>
        <label className="block">
          <span className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700"><span>Password</span><Link to="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700">Forgot password?</Link></span>
          <div className="relative"><input {...register("password")} type={showPassword ? "text" : "password"} placeholder="Enter your password" className={fieldClass + " pr-20"} autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((show) => !show)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-200">{showPassword ? "Hide" : "Show"}</button></div>
          <FieldError error={errors.password} />
        </label>
        {errors.root?.server && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errors.root.server.message}</div>}
        <button disabled={isSubmitting} className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Signing you in..." : "Sign in"}</button>
      </form>
    </AuthShell>
  );
}

export default Login;
