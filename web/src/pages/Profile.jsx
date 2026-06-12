import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "../api/axios";
import { changePasswordSchema, updateProfileSchema } from "../validation/schemas";

const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";
const ErrorText = ({ error }) => error ? <p className="mt-1.5 text-xs font-medium text-rose-600">{error.message}</p> : null;
const Message = ({ value }) => value ? <div role="status" className={"rounded-xl border px-4 py-3 text-sm font-medium " + (value.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700")}>{value.text}</div> : null;

function Profile() {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const profileForm = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: storedUser?.name || "" },
  });
  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const saveProfile = async (values) => {
    try {
      setProfileMessage(null);
      const { data } = await API.put("/auth/profile", values);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("profile-updated"));
      setProfileMessage({ type: "success", text: data.message });
    } catch (error) {
      const fields = error.response?.data?.fieldErrors;
      if (fields?.name) profileForm.setError("name", { message: fields.name });
      else setProfileMessage({ type: "error", text: error.response?.data?.message || "We could not update your profile." });
    }
  };

  const savePassword = async ({ currentPassword, newPassword }) => {
    try {
      setPasswordMessage(null);
      const { data } = await API.put("/auth/change-password", { currentPassword, newPassword });
      passwordForm.reset();
      setPasswordMessage({ type: "success", text: data.message });
    } catch (error) {
      const fields = error.response?.data?.fieldErrors;
      if (fields) Object.entries(fields).forEach(([field, message]) => passwordForm.setError(field, { message }));
      else setPasswordMessage({ type: "error", text: error.response?.data?.message || "We could not change your password." });
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7fb] pb-20">
      <section className="relative overflow-hidden bg-slate-950 px-5 pb-28 pt-14 text-white">
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-400">Personal settings</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Your account</h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-400">Keep your personal details current and protect your account with a strong password.</p>
        </div>
      </section>

      <div className="relative mx-auto -mt-16 grid max-w-6xl gap-7 px-5 lg:grid-cols-[.85fr_1.15fr]">
        <section className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.1)] sm:p-8">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-2xl font-black text-white shadow-lg shadow-blue-600/20">{storedUser?.name?.charAt(0)?.toUpperCase() || "U"}</span>
            <div><h2 className="text-xl font-black text-slate-950">{storedUser?.name}</h2><p className="mt-1 text-sm text-slate-500">{storedUser?.email}</p><span className="mt-2 inline-block rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">{storedUser?.role}</span></div>
          </div>
          <div className="my-7 h-px bg-slate-100" />
          <p className="text-sm leading-6 text-slate-500">Your email address and role are managed by the system. You can update your display name at any time.</p>
          <form onSubmit={profileForm.handleSubmit(saveProfile)} className="mt-6 space-y-4" noValidate>
            <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Display name</span><input {...profileForm.register("name")} className={inputClass} autoComplete="name" /><ErrorText error={profileForm.formState.errors.name} /></label>
            <Message value={profileMessage} />
            <button disabled={profileForm.formState.isSubmitting} className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-60">{profileForm.formState.isSubmitting ? "Saving..." : "Save profile"}</button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.1)] sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Security</p><h2 className="mt-2 text-2xl font-black text-slate-950">Change password</h2><p className="mt-2 text-sm leading-6 text-slate-500">Confirm your existing password before choosing a new one.</p></div><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-600">🔒</span></div>
          <form onSubmit={passwordForm.handleSubmit(savePassword)} className="mt-7 space-y-5" noValidate>
            <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Current password</span><input {...passwordForm.register("currentPassword")} type={showPasswords ? "text" : "password"} className={inputClass} autoComplete="current-password" placeholder="Enter current password" /><ErrorText error={passwordForm.formState.errors.currentPassword} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">New password</span><input {...passwordForm.register("newPassword")} type={showPasswords ? "text" : "password"} className={inputClass} autoComplete="new-password" placeholder="At least 8 characters" /><ErrorText error={passwordForm.formState.errors.newPassword} /></label>
              <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Confirm password</span><input {...passwordForm.register("confirmPassword")} type={showPasswords ? "text" : "password"} className={inputClass} autoComplete="new-password" placeholder="Repeat new password" /><ErrorText error={passwordForm.formState.errors.confirmPassword} /></label>
            </div>
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold text-slate-500"><input type="checkbox" checked={showPasswords} onChange={(event) => setShowPasswords(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600" />Show passwords</label>
            <Message value={passwordMessage} />
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">Use at least 8 characters. Avoid reusing your current password or passwords from other services.</div>
            <button disabled={passwordForm.formState.isSubmitting} className="w-full rounded-xl bg-slate-950 py-3.5 font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-60">{passwordForm.formState.isSubmitting ? "Changing password..." : "Change password"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default Profile;
