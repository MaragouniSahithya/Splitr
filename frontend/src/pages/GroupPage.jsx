import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import api from "../lib/axios";
import { motion, AnimatePresence } from "framer-motion";

import GroupHeader from "../components/group/GroupHeader";
import BudgetProgress from "../components/group/BudgetProgress";
import BalanceSheet from "../components/group/BalanceSheet";
import ExpenseList from "../components/group/ExpenseList";
import AddExpenseModal from "../components/modals/AddExpenseModal";
import InviteModal from "../components/modals/InviteModal";
import SettleUpModal from "../components/modals/SettleUpModal";
import SetBudgetModal from "../components/modals/SetBudgetModal";

import StatusBar from "../components/group/StatusBar";
import MemoriesGallery from "../components/group/MemoriesGallery";

import { ImageIcon, Receipt } from "lucide-react";

const Spinner = () => (
  <div className="flex justify-center items-center py-24 w-full">
    <div className="w-12 h-12 border-4 border-white/10 border-t-splitr-mint rounded-full animate-spin shadow-[0_0_15px_#64ffda]" />
  </div>
);

const GroupPage = () => {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  /* ── state ── */
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgetInfo, setBudgetInfo] = useState({
    totalSpent: 0, budget: 0, budgetUnit: "total", budgetPercent: 0,
  });
  const [loading, setLoading] = useState(true);

  /* modal visibility */
  const [showInvite, setShowInvite] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [showSetBudget, setShowSetBudget] = useState(false);
  const [settleTarget, setSettleTarget] = useState(null);

  /* filters & tabs */
  const [filterCat, setFilterCat] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [activeTab, setActiveTab] = useState("expenses"); // expenses | memories

  /* ── derived ── */
  const memberMap = useMemo(() => {
    const m = {};
    (group?.members || []).forEach((mem) => {
      const uid = mem.userId?._id;
      const name = mem.userId?.name || "Unknown";
      if (uid) m[uid] = name;
    });
    return m;
  }, [group]);

  const isAdmin =
    String(group?.createdBy) === String(user?._id) ||
    group?.members?.some((m) => String(m.userId?._id) === String(user?._id) && m.role === "admin");

  const filteredExpenses = useMemo(() =>
    expenses.filter((exp) => {
      if (filterCat && exp.categoryId?._id !== filterCat) return false;
      if (filterFrom && exp.date < filterFrom) return false;
      if (filterTo && exp.date > filterTo) return false;
      return true;
    }),
    [expenses, filterCat, filterFrom, filterTo]
  );

  /* ── data fetching ── */
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [grpRes, expRes, balRes, catRes, statusRes, memoriesRes] = await Promise.all([
        api.get(`/api/groups/${groupId}`),
        api.get(`/api/expenses/group/${groupId}`),
        api.get(`/api/expenses/group/${groupId}/balances`),
        api.get(`/api/groups/${groupId}/categories`),
        api.get(`/api/groups/${groupId}/statuses`),
        api.get(`/api/groups/${groupId}/memories`),
      ]);
      // Merge separately-fetched statuses & memories into the group object
      setGroup({
        ...grpRes.data,
        statusUpdates: statusRes.data || [],
        memories:      memoriesRes.data || [],
      });
      setExpenses(expRes.data || []);
      setTransactions(balRes.data?.transactions || []);
      setBudgetInfo({
        totalSpent:    balRes.data?.totalSpent    ?? 0,
        budget:        balRes.data?.budget        ?? 0,
        budgetUnit:    balRes.data?.budgetUnit    ?? "total",
        budgetPercent: balRes.data?.budgetPercent ?? 0,
      });
      setCategories(catRes.data || []);
    } catch (err) {
      console.error("GroupPage fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshBalances = async () => {
    try {
      const res = await api.get(`/api/expenses/group/${groupId}/balances`);
      setTransactions(res.data?.transactions || []);
      setBudgetInfo({
        totalSpent: res.data?.totalSpent ?? 0,
        budget: res.data?.budget ?? 0,
        budgetUnit: res.data?.budgetUnit ?? "total",
        budgetPercent: res.data?.budgetPercent ?? 0,
      });
    } catch (err) {
      console.error("Balance refresh error:", err);
    }
  };

  useEffect(() => { fetchAll(); }, [groupId]);

  const handleUpdateAdded = (update) => {
    setGroup(prev => ({ ...prev, statusUpdates: [update, ...(prev.statusUpdates || [])] }));
  };

  const handleMemoryAdded = (memory) => {
    setGroup(prev => ({ ...prev, memories: [memory, ...(prev.memories || [])] }));
  };

  /* Hero Image Upload handler — uses PATCH /cover with multipart FormData */
  const handleHeroUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("image", file);
      // Do NOT set Content-Type — let browser add the correct multipart boundary
      const res = await api.patch(`/api/groups/${groupId}/cover`, formData);
      setGroup((prev) => ({ ...prev, heroImage: res.data.heroImage }));
    } catch (err) {
      console.error("Cover upload error:", err);
    }
  };

  /* ─── RENDER ─── */
  return (
    <div className="min-h-screen w-full relative z-10 overflow-x-hidden">
      {loading ? (
        <Spinner />
      ) : !group ? (
        <div className="text-center py-32 text-slate-400 text-2xl font-bold">Group not found. 🏜️</div>
      ) : (
        <>
          {/* ── MASSIVE HERO BACKGROUND ── */}
          <div className="absolute inset-0 z-0 h-[60vh] md:h-[70vh] w-full">
            {group.heroImage ? (
                <img src={group.heroImage} className="w-full h-full object-cover" alt="Hero" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-splitr-mint to-teal-700" />
            )}
            {/* Dark overlay to merge with body bg */}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-splitr-midnight to-transparent" />
            <div className="absolute inset-0 bg-splitr-midnight/40 backdrop-blur-[2px]" />
          </div>

          <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-12 space-y-6 md:space-y-8">

            {/* Change Hero Button (Admin only) */}
            {isAdmin && (
              <div className="flex justify-end mb-4">
                 <label className="cursor-pointer glass-button px-4 py-2 text-xs font-bold text-white bg-black/30 backdrop-blur">
                    Change Cover
                    <input type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
                 </label>
              </div>
            )}

            {/* ── HEADER DATA CARD ── */}
            <div className="glass-panel p-6 shadow-2xl! border-white/20">
               <GroupHeader
                 group={group}
                 isAdmin={isAdmin}
                 onInviteClick={() => setShowInvite(true)}
               />
            </div>

            {/* ── STATUS UPDATES BAR ── */}
            <StatusBar groupId={groupId} updates={group.statusUpdates || []} user={user} onUpdateAdded={handleUpdateAdded} />

            {/* ── GRID LAYOUT ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
              
              {/* SIDEBAR (Budget & Balances) */}
              <div className="lg:col-span-4 space-y-6 flex flex-col w-full">
                <div className="glass-panel p-5">
                  <BudgetProgress
                    budgetInfo={budgetInfo}
                    isAdmin={isAdmin}
                    onEditBudgetClick={() => setShowSetBudget(true)}
                  />
                </div>

                <div className="glass-panel p-5">
                  <BalanceSheet
                    transactions={transactions}
                    memberMap={memberMap}
                    userId={user?._id}
                    onSettleClick={setSettleTarget}
                  />
                </div>
              </div>

              {/* MAIN CONTENT AREA */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* TABS */}
                <div className="flex bg-splitr-navy/80 p-1.5 rounded-xl border border-white/10 w-full sm:w-fit mb-4">
                   <button
                     onClick={() => setActiveTab("expenses")}
                     className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === "expenses" ? "bg-white/10 text-white shadow-md border border-white/10" : "text-slate-400 hover:text-white"}`}
                   >
                     <Receipt className="w-4 h-4" /> Expenses
                   </button>
                   <button
                     onClick={() => setActiveTab("memories")}
                     className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === "memories" ? "bg-white/10 text-white shadow-md border border-white/10" : "text-slate-400 hover:text-white"}`}
                   >
                     <ImageIcon className="w-4 h-4" /> Memories {(group.memories?.length > 0) && `(${group.memories.length})`}
                   </button>
                </div>

                {/* TAB CONTENT */}
                <div className="w-full">
                  <AnimatePresence mode="wait">
                    {activeTab === "expenses" ? (
                       <motion.div key="expenses" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                         <div className="glass-panel p-1 border-transparent!">
                           <ExpenseList
                              expenses={expenses}
                              filteredExpenses={filteredExpenses}
                              categories={categories}
                              filterCat={filterCat}
                              filterFrom={filterFrom}
                              filterTo={filterTo}
                              onFilterCatChange={setFilterCat}
                              onFilterFromChange={setFilterFrom}
                              onFilterToChange={setFilterTo}
                              onClearFilters={() => { setFilterCat(""); setFilterFrom(""); setFilterTo(""); }}
                              onAddExpenseClick={() => setShowExpense(true)}
                           />
                         </div>
                       </motion.div>
                    ) : (
                       <motion.div key="memories" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                         <div className="glass-panel p-6 shadow-xl">
                            <MemoriesGallery groupId={groupId} memories={group.memories || []} onMemoryAdded={handleMemoryAdded} />
                         </div>
                       </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </div>
          </main>
        </>
      )}

      {/* Modals */}
      {showInvite && (
        <InviteModal groupId={groupId} onClose={() => setShowInvite(false)} />
      )}

      {showExpense && group && (
        <AddExpenseModal
          groupId={groupId}
          members={group.members || []}
          categories={categories}
          onClose={() => setShowExpense(false)}
          onAdded={(newExp) => {
            setExpenses((prev) => [newExp, ...prev]);
            refreshBalances();
          }}
        />
      )}

      {settleTarget && (
        <SettleUpModal
          groupId={groupId}
          transaction={settleTarget}
          memberMap={memberMap}
          onClose={() => setSettleTarget(null)}
          onSettled={refreshBalances}
        />
      )}

      {showSetBudget && (
        <SetBudgetModal
          groupId={groupId}
          current={budgetInfo}
          onClose={() => setShowSetBudget(false)}
          onSaved={refreshBalances}
        />
      )}
    </div>
  );
};

export default GroupPage;
