import { fmt } from "../common/utils";
import { Wallet } from "lucide-react";

/**
 * Budget progress bar + "Set budget" prompt.
 * Always renders — shows a "Set Budget" CTA when budget is 0.
 *
 * Props:
 *  - budgetInfo        : { totalSpent, budget, budgetUnit, budgetPercent }
 *  - isAdmin           : boolean
 *  - onEditBudgetClick : () => void
 */
const BudgetProgress = ({ budgetInfo, isAdmin, onEditBudgetClick }) => {
  const { totalSpent, budget, budgetUnit, budgetPercent: pct } = budgetInfo;

  const barColor =
    pct < 50 ? "bg-splitr-mint" : pct < 80 ? "bg-yellow-400" : "bg-red-500";

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Wallet className="w-4 h-4 text-splitr-mint" />
          Budget Progress
        </h2>
        {isAdmin && (
          <button
            onClick={onEditBudgetClick}
            className="text-xs font-semibold text-splitr-mint hover:text-white transition-colors"
          >
            {budget > 0 ? "Edit" : "Set Budget"}
          </button>
        )}
      </div>

      {/* No budget set */}
      {budget === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center gap-3 border border-dashed border-white/10 rounded-xl">
          <Wallet className="w-8 h-8 text-slate-500" />
          <p className="text-slate-400 text-sm">No budget set for this group.</p>
          {isAdmin ? (
            <button
              onClick={onEditBudgetClick}
              className="text-sm font-semibold text-splitr-midnight bg-splitr-mint hover:bg-[#4df0c9] px-4 py-1.5 rounded-lg transition-colors active:scale-95"
            >
              + Set a Budget
            </button>
          ) : (
            <p className="text-xs text-slate-500">Ask the group admin to set one.</p>
          )}
        </div>
      ) : (
        <>
          {/* Amount label */}
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">
              ₹{fmt(totalSpent)}{" "}
              <span className="text-slate-500">of ₹{fmt(budget)} spent</span>
              {budgetUnit === "per_person" && (
                <span className="ml-1 text-xs text-slate-500">(per person)</span>
              )}
            </span>
            <span
              className={`font-bold text-xs ${
                pct >= 80 ? "text-red-400" : pct >= 50 ? "text-yellow-400" : "text-splitr-mint"
              }`}
            >
              {pct}% used
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/5">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_currentColor] ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Remaining */}
          <p className="text-xs text-slate-400 mt-2 text-right">
            ₹{fmt(Math.max(0, budget - totalSpent))} remaining
          </p>
        </>
      )}
    </section>
  );
};

export default BudgetProgress;
