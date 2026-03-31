import { Link, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { LayoutDashboard, Receipt, LogOut, User } from "lucide-react";
import clsx from "clsx";

const Layout = ({ children }) => {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Expenses", path: "/expenses/my", icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-splitr-midnight text-slate-300 flex">
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-splitr-navy/80 backdrop-blur-2xl border-r border-white/10 z-50 shadow-glass">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-splitr-mint to-teal-500 flex items-center justify-center text-splitr-midnight font-bold text-xl shadow-[0_0_15px_rgba(100,255,218,0.5)]">
            S
          </div>
          <span className="text-2xl font-bold text-white tracking-widest">SPLITR</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-8">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={clsx(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group",
                  active
                    ? "bg-white/10 text-splitr-mint shadow-[inset_4px_0_0_#64ffda]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon
                  className={clsx("w-5 h-5 transition-transform duration-300 group-hover:scale-110", active && "drop-shadow-[0_0_8px_rgba(100,255,218,0.8)]")}
                />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center border border-white/20">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-400 hover:text-splitr-neonred hover:bg-white/5 rounded-xl transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM BAR ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-splitr-navy/90 backdrop-blur-2xl border-t border-white/10 z-50 flex justify-around p-3 pb-safe shadow-glass">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={clsx(
                "flex flex-col items-center gap-1 p-2 rounded-xl min-w-[64px] transition-all",
                active ? "text-splitr-mint drop-shadow-[0_0_8px_rgba(100,255,218,0.5)]" : "text-slate-400"
              )}
            >
              <Icon className={clsx("w-6 h-6", active && "mb-1")} />
              {active && <span className="text-[10px] font-medium">{item.name}</span>}
              {active && <div className="w-1 h-1 rounded-full bg-splitr-mint mt-1 shadow-[0_0_5px_#64ffda]" />}
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 p-2 rounded-xl min-w-[64px] text-slate-400 hover:text-splitr-neonred transition-all"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </nav>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-0 min-h-screen relative overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;
