import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import useGroupStore from "../store/groupStore";
import api from "../lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { ArrowUpRight, ArrowDownRight, Users, Plus, Mail, Check, X } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(Math.abs(n));

const Spinner = () => (
  <div className="flex justify-center items-center py-20 w-full">
    <div className="w-12 h-12 border-4 border-white/10 border-t-splitr-mint rounded-full animate-spin shadow-[0_0_15px_#64ffda]" />
  </div>
);

const CreateGroupModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Group name is required.");
    try {
      setLoading(true);
      setError("");
      const res = await api.post("/api/groups", {
        name: name.trim(),
        description: description.trim(),
      });
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create group.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel w-full max-w-md p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-6 tracking-wide">
          Create New Group
        </h2>

        {error && (
          <p className="mb-4 text-sm text-red-200 bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Group name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Goa Trip 2025"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-splitr-mint focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Description <span className="text-slate-500">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What's this group for?"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-splitr-mint focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-splitr-midnight bg-splitr-mint hover:bg-[#4df0c9] shadow-[0_0_15px_rgba(100,255,218,0.4)] disabled:opacity-60 transition-all active:scale-95"
            >
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const groups = useGroupStore((s) => s.groups);
  const setGroups = useGroupStore((s) => s.setGroups);

  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState({ owe: 0, owed: 0 });
  const [showModal, setShowModal] = useState(false);
  const [groupBalancesList, setGroupBalancesList] = useState([]);

  // Pending invites
  const [invites, setInvites] = useState([]);
  const [inviteLoading, setInviteLoading] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [groupsRes, invitesRes] = await Promise.all([
          api.get("/api/groups"),
          api.get("/api/groups/invites"),
        ]);
        setGroups(groupsRes.data);
        setInvites(invitesRes.data || []);

        if (groupsRes.data.length > 0) {
          const balanceResults = await Promise.allSettled(
            groupsRes.data.map((g) => api.get(`/api/expenses/group/${g._id}/balances`))
          );

          let totalOwe = 0;
          let totalOwed = 0;
          const list = [];

          balanceResults.forEach((result, idx) => {
            if (result.status !== "fulfilled") return;
            const { balances: bals } = result.value.data || {};
            let groupOwe = 0;
            let groupOwed = 0;
            if (bals && typeof bals === "object") {
              // bals is { userId: netAmount }
              Object.entries(bals).forEach(([uid, amount]) => {
                if (uid === user?._id) {
                  if (amount < 0) {
                    totalOwe += Math.abs(amount);
                    groupOwe += Math.abs(amount);
                  } else {
                    totalOwed += amount;
                    groupOwed += amount;
                  }
                }
              });
            }
            list.push({ groupName: groupsRes.data[idx].name, owe: groupOwe, owed: groupOwed });
          });

          setBalances({ owe: totalOwe, owed: totalOwed });
          setGroupBalancesList(list);
        }
      } catch {
        // Silently handle fetch error — UI shows empty states
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?._id, setGroups]);

  const handleGroupCreated = (newGroup) => setGroups([...groups, newGroup]);

  const handleInviteRespond = async (inviteGroupId, action) => {
    setInviteLoading((prev) => ({ ...prev, [inviteGroupId]: true }));
    try {
      await api.post(`/api/groups/invites/${inviteGroupId}/respond`, { action });
      setInvites((prev) => prev.filter((inv) => inv.groupId?._id !== inviteGroupId));
      if (action === "accept") {
        // Reload groups to include the newly joined group
        const groupsRes = await api.get("/api/groups");
        setGroups(groupsRes.data);
      }
    } catch {
      // Could show a toast here; for now fail silently
    } finally {
      setInviteLoading((prev) => ({ ...prev, [inviteGroupId]: false }));
    }
  };

  // Chart — all balances may genuinely be 0; handle that gracefully
  const hasChartData = groupBalancesList.some((g) => g.owe > 0 || g.owed > 0);

  const chartData = {
    labels: groupBalancesList.map((g) => g.groupName),
    datasets: [
      {
        label: "Owed to You",
        data: groupBalancesList.map((g) => g.owed),
        backgroundColor: "#64ffda",
        borderRadius: 6,
      },
      {
        label: "You Owe",
        data: groupBalancesList.map((g) => g.owe),
        backgroundColor: "#ff3366",
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { color: "#cbd5e1", font: { size: 12 } } },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ₹${fmt(ctx.raw)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: {
          color: "#94a3b8",
          callback: (val) => `₹${val.toLocaleString("en-IN")}`,
        },
      },
      x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
    },
  };

  return (
    <div className="w-full h-full p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Hi, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-slate-400 mt-2">Here is your financial status across all groups.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="glass-button flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white group"
        >
          <Plus className="w-5 h-5 text-splitr-mint group-hover:rotate-90 transition-transform duration-300" />
          Create Group
        </button>
      </div>

      {/* ── PENDING INVITES ── */}
      <AnimatePresence>
        {invites.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel p-6 border border-splitr-mint/20 shadow-[0_0_20px_rgba(100,255,218,0.08)]"
          >
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-splitr-mint" />
              Pending Invites
              <span className="ml-1 text-xs font-bold bg-splitr-mint/20 text-splitr-mint border border-splitr-mint/30 px-2 py-0.5 rounded-full">
                {invites.length}
              </span>
            </h2>
            <div className="space-y-3">
              {invites.map((inv) => {
                const gId = inv.groupId?._id;
                const gName = inv.groupId?.name || "Unknown Group";
                const inviterName = inv.groupId?.createdBy?.name || "Someone";
                const busy = inviteLoading[gId];
                return (
                  <div
                    key={inv._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 border border-white/5 rounded-xl px-4 py-3"
                  >
                    <div>
                      <p className="text-white font-semibold">{gName}</p>
                      <p className="text-slate-400 text-xs mt-0.5">Invited by {inviterName}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleInviteRespond(gId, "accept")}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-splitr-midnight bg-splitr-mint hover:bg-[#4df0c9] transition-colors disabled:opacity-50 active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleInviteRespond(gId, "reject")}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50 active:scale-95"
                      >
                        <X className="w-4 h-4" />
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {loading ? (
        <Spinner />
      ) : (
        <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel p-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-splitr-mint/10 rounded-full blur-3xl group-hover:bg-splitr-mint/20 transition-all duration-500 -translate-y-10 translate-x-10" />
              <div className="flex items-center gap-3 mb-4 text-splitr-mint">
                <div className="p-2 bg-splitr-mint/10 rounded-lg shadow-[0_0_10px_rgba(100,255,218,0.2)]">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <h3 className="font-semibold tracking-wide">Total Owed to You</h3>
              </div>
              <p className="text-4xl font-black tracking-tight text-white mt-2">₹{fmt(balances.owed)}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-splitr-neonred/10 rounded-full blur-3xl group-hover:bg-splitr-neonred/20 transition-all duration-500 -translate-y-10 translate-x-10" />
              <div className="flex items-center gap-3 mb-4 text-splitr-neonred">
                <div className="p-2 bg-splitr-neonred/10 rounded-lg shadow-[0_0_10px_rgba(255,51,102,0.2)]">
                  <ArrowDownRight className="w-6 h-6" />
                </div>
                <h3 className="font-semibold tracking-wide">Total You Owe</h3>
              </div>
              <p className="text-4xl font-black tracking-tight text-white mt-2">₹{fmt(balances.owe)}</p>
            </motion.div>
          </div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3 glass-panel p-6 flex flex-col"
          >
            <h3 className="font-semibold tracking-wide text-slate-300 mb-6">Balances by Group</h3>
            <div className="flex-1 w-full min-h-[300px]">
              {groupBalancesList.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  No groups to display. Create a group to see your balances here.
                </div>
              ) : !hasChartData ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
                  <p className="text-2xl">🎉</p>
                  <p>All settled up! No outstanding balances across any group.</p>
                </div>
              ) : (
                <Bar data={chartData} options={chartOptions} />
              )}
            </div>
          </motion.div>

          {/* Groups List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-4 mt-4"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Users className="w-6 h-6 text-splitr-mint" /> Active Groups
            </h2>

            {groups.length === 0 ? (
              <div className="glass-panel text-center py-16 px-6">
                <div className="w-20 h-20 bg-splitr-mint/10 text-splitr-mint rounded-full flex flex-col items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(100,255,218,0.2)]">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No active groups</h3>
                <p className="text-slate-400 max-w-md mx-auto mb-6">
                  Create a group to start adding expenses, uploading memories, and splitting bills with friends.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="glass-button px-6 py-3 font-semibold text-white bg-white/10"
                >
                  Create a Group
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group, idx) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * idx }}
                    key={group._id}
                    onClick={() => navigate(`/groups/${group._id}`)}
                    className="glass-panel cursor-pointer hover:bg-white/10 hover:border-white/20 hover:shadow-[0_8px_32px_rgba(100,255,218,0.1)] transition-all duration-300 group overflow-hidden relative"
                  >
                    {group.heroImage ? (
                      <div className="h-24 w-full relative">
                        <img src={group.heroImage} alt="hero" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-splitr-navy/90 to-transparent" />
                      </div>
                    ) : (
                      <div className="h-4 w-full bg-gradient-to-r from-splitr-mint to-teal-500 opacity-80" />
                    )}

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-splitr-mint transition-colors">
                        {group.name}
                      </h3>
                      {group.description && (
                        <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-white/5 py-1.5 px-3 rounded-md w-fit border border-white/5">
                        <Users className="w-3.5 h-3.5" />
                        {group.memberCount ?? 0} {group.memberCount === 1 ? "member" : "members"}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </main>
      )}

      {showModal && <CreateGroupModal onClose={() => setShowModal(false)} onCreated={handleGroupCreated} />}
    </div>
  );
};

export default DashboardPage;
