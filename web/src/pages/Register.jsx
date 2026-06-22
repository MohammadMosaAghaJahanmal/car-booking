import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import AuthShell from "../components/AuthShell";

const fieldClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await API.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <AuthShell eyebrow="Join CarBooking" title="Create your account" description="A few details are all it takes to start booking better rides." footer={<>Already have an account? <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700">Sign in</Link></>}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Full name</span><input name="name" value={form.name} placeholder="Your full name" onChange={handleChange} className={fieldClass} autoComplete="name" required /></label>
        <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Email address</span><input name="email" type="email" value={form.email} placeholder="you@example.com" onChange={handleChange} className={fieldClass} autoComplete="email" required /></label>
        <label className="block">
          <span className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700"><span>Password</span><span className="text-xs font-medium text-slate-400">Minimum 6 characters</span></span>
          <div className="relative"><input name="password" type={showPassword ? "text" : "password"} value={form.password} placeholder="Create a secure password" onChange={handleChange} className={fieldClass + " pr-20"} autoComplete="new-password" minLength="6" required /><button type="button" onClick={() => setShowPassword((show) => !show)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-200">{showPassword ? "Hide" : "Show"}</button></div>
        </label>
        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
        <button disabled={loading} className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Creating your account..." : "Create account!"}</button>
      </form>
    </AuthShell>
  );
}

export default Register;
