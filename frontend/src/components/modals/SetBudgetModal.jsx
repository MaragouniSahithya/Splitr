import { useState } from "react";
import ModalShell, { inputCls, labelCls, btnPrimary, btnSecondary, ErrorBanner } from "../common/ModalShell";
import api from "../../lib/axios";

/**
 * Fully implemented SetBudgetModal.
 *
 * Props:
 *  - groupId  : string
 *  - current  : { budget, budgetUnit }  — pre-fills the form with existing values
 *  - onClose  : () => void
 *  - onSaved  : () => void  — called after a successful PUT; parent uses this to refreshBalances()
 */
const SetBudgetModal = ({ groupId, current, onClose, onSaved }) => {
  const [amount, setBudgetAmount] = useState(current?.budget || "");
  const [budgetUnit, setBudgetUnit] = useState(current?.budgetUnit || "total");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) {
      setError("Enter a valid amount.");
      return;
    }
    try {
      setLoading(true); setError("");
      await api.put(`/api/groups/${groupId}/budget`, {
        budget: parseFloat(amount),
        budgetUnit,
      });
      onSaved();   // triggers refreshBalances() in GroupPage
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save budget.");
    } finally { setLoading(false); }
  };

  return (
    <ModalShell title="Set Budget" onClose={onClose}>
      <ErrorBanner msg={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Budget amount */}
        <div>
          <label className={labelCls}>Budget amount (₹)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            placeholder="e.g. 10000"
            className={inputCls}
          />
        </div>

        {/* Budget type toggle */}
        <div>
          <label className={labelCls}>Budget type</label>
          <div className="flex gap-2">
            {["total", "per_person"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setBudgetUnit(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                  budgetUnit === t
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                }`}
              >
                {t === "total" ? "Total group" : "Per person"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? "Saving…" : "Save Budget"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default SetBudgetModal;
