import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { disconnectSocket } from "../socket";
import NotificationBell from "./NotificationBell";

const navClass = ({ isActive }) =>
  "relative rounded-lg px-3 py-2 text-sm font-semibold transition " +
  (isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white");

function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const initial = user?.name?.charAt(0)?.toUpperCase() || "U";

  const logout = () => {
    disconnectSocket();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 text-white shadow-lg shadow-slate-950/10 backdrop-blur-xl">
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" onClick={() => setMenuOpen(false)} className="group flex items-center gap-3">
          <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-blue-600 font-black shadow-lg shadow-blue-600/20 transition group-hover:scale-105">
            <span className="absolute -right-3 -top-3 h-8 w-8 rounded-full bg-white/20" />
            <span className="relative">CB</span>
          </span>
          <span>
            <span className="block text-lg font-bold leading-none tracking-tight">CarBooking</span>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.22em] text-blue-400">Ride with confidence</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={navClass}>Home</NavLink>
          {user && <NavLink to="/my-bookings" className={navClass}>My Bookings</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin" className={navClass}>Admin</NavLink>}
          {user?.role === "driver" && <NavLink to="/driver" className={navClass}>Driver Console</NavLink>}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <NotificationBell />
              <div className="flex items-center gap-2.5 border-l border-white/10 pl-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-bold shadow-md">{initial}</span>
                <div className="max-w-28">
                  <p className="truncate text-sm font-semibold">{user.name || "Account"}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{user.role || "user"}</p>
                </div>
              </div>
              <button onClick={logout} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-300">
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/register" className="px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white">Create account</Link>
              <Link to="/login" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold shadow-lg shadow-blue-600/20 transition hover:bg-blue-500">Sign in</Link>
            </div>
          )}
        </div>

        {user && <div className="ml-auto mr-2 md:hidden"><NotificationBell /></div>}

        <button onClick={() => setMenuOpen((open) => !open)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-200 md:hidden" aria-label="Toggle navigation" aria-expanded={menuOpen}>
          {menuOpen ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" /></svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" /></svg>
          )}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-white/10 bg-slate-950 px-5 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            <NavLink to="/" onClick={() => setMenuOpen(false)} className={navClass}>Home</NavLink>
            {user && <NavLink to="/my-bookings" onClick={() => setMenuOpen(false)} className={navClass}>My Bookings</NavLink>}
            {user?.role === "admin" && <NavLink to="/admin" onClick={() => setMenuOpen(false)} className={navClass}>Admin Dashboard</NavLink>}
            {user?.role === "driver" && <NavLink to="/driver" onClick={() => setMenuOpen(false)} className={navClass}>Driver Console</NavLink>}
            <div className="my-3 border-t border-white/10" />
            {user ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-bold">{initial}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{user.name || "Account"}</p><p className="text-xs capitalize text-slate-500">{user.role || "user"}</p></div></div>
                <button onClick={logout} className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-300">Logout</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link to="/register" onClick={() => setMenuOpen(false)} className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold">Create account</Link>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-bold">Sign in</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
