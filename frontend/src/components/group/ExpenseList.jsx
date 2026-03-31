import { fmt } from "../common/utils";

/**
 * Filter bar + expense card list.
 *
 * Props:
 *  - expenses            : all raw expenses (used for empty-state copy)
 *  - filteredExpenses    : expenses after filter applied
 *  - categories          : [{ _id, name }]
 *  - filterCat           : string
 *  - filterFrom          : string (YYYY-MM-DD)
 *  - filterTo            : string (YYYY-MM-DD)
 *  - onFilterCatChange   : (val) => void
 *  - onFilterFromChange  : (val) => void
 *  - onFilterToChange    : (val) => void
 *  - onClearFilters      : () => void
 *  - onAddExpenseClick   : () => void
 */
const ExpenseList = ({
  expenses,
  filteredExpenses,
  categories,
  filterCat,
  filterFrom,
  filterTo,
  onFilterCatChange,
  onFilterFromChange,
  onFilterToChange,
  onClearFilters,
  onAddExpenseClick,
}) => (
  <section>
    {/* Header + Add button */}
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-semibold text-gray-800">Expenses</h2>
      <button
        onClick={onAddExpenseClick}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Expense
      </button>
    </div>

    {/* Filter row */}
    <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-3">
      {categories.length > 0 && (
        <select
          value={filterCat}
          onChange={(e) => onFilterCatChange(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      )}
      <div className="flex gap-2 flex-1">
        <input
          type="date"
          value={filterFrom}
          onChange={(e) => onFilterFromChange(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          title="From date"
        />
        <input
          type="date"
          value={filterTo}
          onChange={(e) => onFilterToChange(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          title="To date"
        />
      </div>
      {(filterCat || filterFrom || filterTo) && (
        <button
          onClick={onClearFilters}
          className="text-xs text-indigo-500 hover:underline self-center shrink-0"
        >
          Clear filters
        </button>
      )}
    </div>

    {/* Expense cards */}
    {filteredExpenses.length === 0 ? (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <p className="text-3xl mb-3">🧾</p>
        <p className="text-gray-400 text-sm">
          {expenses.length === 0
            ? "No expenses yet. Add the first one!"
            : "No expenses match the current filters."}
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {filteredExpenses.map((exp) => {
          const catColor = exp.categoryId?.color || "#6366f1";
          const catName  = exp.categoryId?.name;
          const dateStr  = exp.date
            ? new Date(exp.date).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })
            : "";

          return (
            <div
              key={exp._id}
              className="bg-white rounded-xl shadow-sm p-4 sm:p-5 flex items-start justify-between gap-4 hover:shadow-md transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800 truncate">
                    {exp.description}
                  </span>
                  {catName && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                      style={{ backgroundColor: catColor }}
                    >
                      {catName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Paid by{" "}
                  <span className="text-gray-600 font-medium">
                    {exp.paidBy?.name || "Unknown"}
                  </span>
                  {dateStr && <> · {dateStr}</>}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-gray-800">₹{fmt(exp.amount)}</p>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </section>
);

export default ExpenseList;
