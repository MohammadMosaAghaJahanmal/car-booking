import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { getSocket } from "../socket";

const typeStyle = {
  booking: "bg-blue-500",
  status: "bg-violet-500",
  ride: "bg-cyan-500",
  driver: "bg-emerald-500",
  payment: "bg-emerald-500",
  cancelled: "bg-rose-500",
};

const formatTime = (value) => {
  const date = new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function NotificationBell() {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    API.get("/notifications")
      .then(({ data }) => {
        if (!active) return;
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    const socket = getSocket();
    const receive = (notification) => {
      setNotifications((current) => [notification, ...current].slice(0, 50));
      setUnreadCount((count) => count + 1);
    };
    socket.on("notification", receive);
    return () => {
      active = false;
      socket.off("notification", receive);
    };
  }, []);

  useEffect(() => {
    const close = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const readNotification = async (notification) => {
    if (!notification.readAt) {
      try {
        await API.put("/notifications/" + notification.id + "/read");
        setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        return;
      }
    }
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const readAll = async () => {
    if (!unreadCount) return;
    try {
      await API.put("/notifications/read-all");
      const now = new Date().toISOString();
      setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt || now })));
      setUnreadCount(0);
    } catch {
      // Keep the current unread state if the request fails.
    }
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-white"
        aria-label={unreadCount ? unreadCount + " unread notifications" : "Notifications"}
        aria-expanded={open}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17H9m9-2V11a6 6 0 10-12 0v4l-2 2h16l-2-2zm-8 5h4" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-slate-950 bg-rose-500 px-1 text-[10px] font-black text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section className="absolute right-0 top-12 z-[70] w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-950/25">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold">Notifications</h2>
              <p className="mt-0.5 text-xs text-slate-500">{unreadCount ? unreadCount + " unread update" + (unreadCount === 1 ? "" : "s") : "You are all caught up"}</p>
            </div>
            <button type="button" onClick={readAll} disabled={!unreadCount} className="text-xs font-bold text-blue-600 transition hover:text-blue-500 disabled:cursor-default disabled:text-slate-300">
              Mark all read
            </button>
          </header>

          <div className="max-h-[26rem] overflow-y-auto">
            {loading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M15 17H9m9-2V11a6 6 0 10-12 0v4l-2 2h16l-2-2z" /></svg>
                </span>
                <p className="mt-3 text-sm font-bold">No notifications yet</p>
                <p className="mt-1 text-xs text-slate-500">Ride and payment updates will appear here.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  onClick={() => readNotification(notification)}
                  className={"flex w-full gap-3 border-b border-slate-100 px-5 py-4 text-left transition last:border-0 hover:bg-slate-50 " + (!notification.readAt ? "bg-blue-50/60" : "bg-white")}
                >
                  <span className={"mt-1 h-2.5 w-2.5 shrink-0 rounded-full " + (typeStyle[notification.type] || "bg-slate-400")} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className={"text-sm " + (!notification.readAt ? "font-bold text-slate-950" : "font-semibold text-slate-700")}>{notification.title}</span>
                      <span className="shrink-0 text-[10px] font-medium text-slate-400">{formatTime(notification.createdAt)}</span>
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{notification.message}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default NotificationBell;
