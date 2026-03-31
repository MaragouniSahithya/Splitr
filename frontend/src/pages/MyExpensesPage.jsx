import { useEffect, useState, useMemo, useCallback } from "react";
import useAuthStore from "../store/authStore";
import api from "../lib/axios";

const fmtAmount = (n) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(Math.abs(n ?? 0));

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

const toISOLocal = (d) => d.toISOString().slice(0, 10);

const Spinner = () => (
  <div className="flex justify-center items-center py-24">
    <div className="w-12 h-12 border-4 border-white/10 border-t-splitr-mint rounded-full animate-spin shadow-[0_0_15px_#64ffda]" />
  </div>
);

const SummaryCard = ({ label, value, icon, glowColor }) => (
  <div className="glass-panel p-5 flex items-center gap-4 relative overflow-hidden group">
    <div
      className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-all -translate-y-6 translate-x-6"
      style={{ backgroundColor: glowColor }}
    />
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 relative z-10"
      style={{ backgroundColor: `${glowColor}20` }}
    >
      {icon}
    </div>
    <div className="relative z-10">
      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-2xl font-bold mt-0.5 text-white">{value}</p>
    </div>
  </div>
);

const MyExpensesPage = () => {
  const user = useAuthStore((s) => s.user);

  const [expenses, setExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupId, setGroupId] = useState("");

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;
      if (groupId)   params.groupId   = groupId;

      const res = await api.get("/api/expenses/my", { params });
      setExpenses(res.data || []);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, groupId]);

  useEffect(() => {
    api.get("/api/groups")
      .then((res) => setGroups(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const clearFilters = () => { setStartDate(""); setEndDate(""); setGroupId(""); };
  const hasFilters = startDate || endDate || groupId;

  const { monthStart, monthEnd } = useMemo(() => {
    const now = new Date();
    return {
      monthStart: toISOLocal(new Date(now.getFullYear(), now.getMonth(), 1)),
      monthEnd:   toISOLocal(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }, []);

  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0),
    [expenses]
  );

  const monthSpent = useMemo(() => {
    return expenses
      .filter((e) => {
        const d = (e.date || "").slice(0, 10);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);
  }, [expenses, monthStart, monthEnd]);

  const activeGroupCount = useMemo(() => {
    const ids = new Set(
      expenses.map((e) => e.groupId?._id || e.groupId || "").filter(Boolean)
    );
    return ids.size;
  }, [expenses]);

  const grouped = useMemo(() => {
    const map = new Map();
    expenses.forEach((exp) => {
      const dateKey = (exp.date || "").slice(0, 10);
      if (!dateKey) return;
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey).push(exp);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a > b ? -1 : 1));
  }, [expenses]);

  return (
    <div className="w-full h-full relative z-10 p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">

      {/* Page title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">My Expenses</h1>
        <p className="text-sm text-slate-400 mt-1">Your share across all groups</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Total spent"   value={`₹${fmtAmount(totalSpent)}`}  icon="💸" glowColor="#6366f1" />
        <SummaryCard label="This month"    value={`₹${fmtAmount(monthSpent)}`}  icon="📅" glowColor="#8b5cf6" />
        <SummaryCard label="Active groups" value={activeGroupCount}              icon="👥" glowColor="#10b981" />
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wide">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-splitr-mint transition"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wide">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-splitr-mint transition"
          />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wide">Group</label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-splitr-mint transition"
          >
            <option value="" className="bg-splitr-navy">All groups</option>
            {groups.map((g) => (
              <option key={g._id} value={g._id} className="bg-splitr-navy">{g.name}</option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-splitr-mint hover:text-white font-semibold transition self-end pb-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Expense List */}
      {loading ? (
        <Spinner />
      ) : grouped.length === 0 ? (
        <div className="glass-panel p-14 flex flex-col items-center text-center">
          <p className="text-4xl mb-3">🧾</p>
          <p className="text-slate-400 text-sm">
            No expenses found
            {hasFilters && (
              <>
                {" "}for the selected filters.{" "}
                <button onClick={clearFilters} className="text-splitr-mint hover:underline font-semibold">
                  Clear filters
                </button>
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dateKey, items]) => (
            <section key={dateKey}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {fmtDate(dateKey)}
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <div className="space-y-2">
                {items.map((exp, idx) => {
                  const paidBy     = exp.paidBy;
                  const youPaid    = String(paidBy?._id || paidBy) === String(user?._id);
                  const paidByName = youPaid ? "You" : (paidBy?.name || "Unknown");
                  const catName    = exp.categoryId?.name;
                  const catColor   = exp.categoryId?.color || "#6366f1";
                  const groupName  = exp.groupId?.name || "";

                  return (
                    <div
                      key={exp._id || idx}
                      className="glass-panel px-5 py-4 flex items-start justify-between gap-4 hover:bg-white/5 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white truncate">
                            {exp.description}
                          </span>
                          {catName && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium text-white shrink-0"
                              style={{ backgroundColor: catColor }}
                            >
                              {catName}
                            </span>
                          )}
                        </div>

                        {groupName && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{groupName}</p>
                        )}

                        <p className="text-xs text-slate-400 mt-0.5">
                          {youPaid ? (
                            <span className="text-splitr-mint font-medium">You paid</span>
                          ) : (
                            <>Paid by <span className="text-slate-300 font-medium">{paidByName}</span></>
                          )}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-white">₹{fmtAmount(exp.amount)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">total</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyExpensesPage;
