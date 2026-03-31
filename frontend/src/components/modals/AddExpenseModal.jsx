import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { X, Image as ImageIcon, Receipt } from "lucide-react";
import { today } from "../common/utils";
import api from "../../lib/axios";

const AddExpenseModal = ({ groupId, members, categories, onClose, onAdded }) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [splitType, setSplitType] = useState("equal");
  const [customSplits, setCustomSplits] = useState({});
  const [date, setDate] = useState(today());
  const [receiptImage, setReceiptImage] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const equalShare = useMemo(() => {
    const n = members.length;
    const a = parseFloat(amount);
    if (!n || !a || isNaN(a)) return 0;
    return (a / n).toFixed(2);
  }, [amount, members.length]);

  const handleCustomChange = (memberId, val) =>
    setCustomSplits((prev) => ({ ...prev, [memberId]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return setError("Description is required.");
    if (!amount || isNaN(parseFloat(amount))) return setError("A valid amount is required.");

    setLoading(true);
    setError("");

    try {
      let receiptUrl = null;
      if (receiptImage) {
        const formData = new FormData();
        formData.append("image", receiptImage);
        const uploadRes = await api.post("/api/upload", formData);
        receiptUrl = uploadRes.data.imageUrl;
      }

      const payload = {
        groupId,
        description: description.trim(),
        amount: parseFloat(amount),
        splitType,
        date,
        receiptImage: receiptUrl,
      };
      if (categoryId) payload.categoryId = categoryId;
      if (splitType === "custom") {
        payload.splits = Object.entries(customSplits).map(([userId, amt]) => ({
          userId,
          amount: parseFloat(amt) || 0,
        }));
      }

      const res = await api.post("/api/expenses", payload);
      
      setShowConfetti(true);
      setTimeout(() => {
        onAdded(res.data);
        onClose();
      }, 2500);

    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add expense.");
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-splitr-mint focus:border-transparent transition-all shadow-inner";
  const labelCls = "block text-sm font-medium text-slate-300 ml-1 mb-1.5";

  return (
    <>
      <div className="fixed inset-0 z-[100] flex justify-end bg-splitr-midnight/60 backdrop-blur-sm" onClick={loading || showConfetti ? undefined : onClose}>
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-md h-full bg-splitr-navy border-l border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col relative"
          onClick={(e) => e.stopPropagation()}
        >
          {showConfetti && <Confetti width={500} height={1000} recycle={false} numberOfPieces={400} />}
          
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
              <Receipt className="text-splitr-mint w-6 h-6" /> Add Expense
            </h2>
            <button onClick={onClose} disabled={loading || showConfetti} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-full transition-colors disabled:opacity-50">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form id="expense-form" onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className={labelCls}>Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Dinner at Thalassa" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Amount (₹)</label>
                <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {categories.length > 0 && (
                  <div>
                    <label className={labelCls}>Category</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
                      <option value="" className="bg-splitr-navy text-slate-300">No category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id} className="bg-splitr-navy text-slate-300">{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className={labelCls}>Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /> /* Removed color-scheme:dark fallback for brevity, relying on browser */ 
                </div>
              </div>

              {/* Receipt Upload */}
              <div>
                <label className={labelCls}>Receipt / Image</label>
                <label className="cursor-pointer w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 rounded-xl bg-white/5 hover:bg-white/10 hover:border-splitr-mint/50 transition-all text-slate-300 hover:text-white">
                  <ImageIcon className="w-8 h-8 mb-2 text-splitr-mint" />
                  <span className="text-sm font-semibold">{receiptImage ? receiptImage.name : "Upload Receipt"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setReceiptImage(e.target.files[0])} />
                </label>
              </div>

              {/* Split Type */}
              <div>
                <label className={labelCls}>Split Mode</label>
                <div className="flex gap-2 p-1 bg-black/20 rounded-xl border border-white/5">
                  {["equal", "custom"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSplitType(t)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        splitType === t
                          ? "bg-white/10 text-splitr-mint shadow-md"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {t === "equal" ? "Equally" : "Custom Amounts"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Splits Preview */}
              {members.length > 0 && (
                <div className="bg-black/10 border border-white/5 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-bold text-splitr-mint/70 uppercase tracking-widest mb-1 pl-1">
                    {splitType === "equal" ? "Each person pays" : "Enter specific amounts"}
                  </p>
                  {members.map((m) => {
                    const name = m.userId?.name || "Unknown";
                    const uid = m.userId?._id || m._id;
                    const avatar = m.userId?.avatarUrl;
                    return (
                      <div key={uid} className="flex items-center justify-between gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                             {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : name[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-slate-200">{name}</span>
                        </div>
                        {splitType === "equal" ? (
                          <span className="text-sm font-bold text-splitr-mint tracking-wide">₹{equalShare}</span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={customSplits[uid] || ""}
                            onChange={(e) => handleCustomChange(uid, e.target.value)}
                            className="w-24 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-right text-white focus:outline-none focus:border-splitr-mint"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </form>
          </div>

          <div className="p-6 border-t border-white/5 bg-splitr-navy/80 backdrop-blur-md">
            <button
              form="expense-form"
              type="submit"
              disabled={loading || showConfetti}
              className="w-full py-4 rounded-xl text-splitr-midnight font-black text-lg tracking-wide bg-splitr-mint hover:bg-[#4df0c9] shadow-[0_0_20px_rgba(100,255,218,0.4)] transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? "Adding..." : showConfetti ? "Success!" : "Add Expense"}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default AddExpenseModal;
