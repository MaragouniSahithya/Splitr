import { fmt } from "../common/utils";

/**
 * "Who owes whom" section.
 *
 * Props:
 *  - transactions  : [{ from, to, amount }]
 *  - memberMap     : { userId: name }
 *  - userId        : current user's _id
 *  - onSettleClick : (transaction) => void
 */
const BalanceSheet = ({ transactions, memberMap, userId, onSettleClick }) => (
  <section>
    <h2 className="text-lg font-semibold text-gray-800 mb-3">
      Who owes whom 💸
    </h2>

    {transactions.length === 0 ? (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="text-gray-500 text-sm">All settled up!</p>
      </div>
    ) : (
      <div className="space-y-2">
        {transactions.map((tx, i) => {
          const fromName = memberMap[tx.from] || tx.from;
          const toName   = memberMap[tx.to]   || tx.to;
          const isYouFrom = tx.from === userId;
          const isYouTo   = tx.to   === userId;

          return (
            <div
              key={i}
              className={`bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isYouFrom ? "border-l-4 border-red-400" : isYouTo ? "border-l-4 border-green-400" : ""
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-semibold ${isYouFrom ? "text-red-600" : "text-gray-800"}`}>
                  {isYouFrom ? "You" : fromName}
                </span>
                <span className="text-gray-400 text-sm">owes</span>
                <span className={`font-semibold ${isYouTo ? "text-green-600" : "text-gray-800"}`}>
                  {isYouTo ? "You" : toName}
                </span>
                <span className="text-indigo-600 font-bold">₹{fmt(tx.amount)}</span>
              </div>

              {/* Settle up — only shown to the debtor */}
              {isYouFrom && (
                <button
                  onClick={() => onSettleClick(tx)}
                  className="px-4 py-1.5 text-sm font-medium rounded-lg text-white bg-emerald-500 hover:bg-emerald-600 transition shrink-0"
                >
                  Settle Up
                </button>
              )}
            </div>
          );
        })}
      </div>
    )}
  </section>
);

export default BalanceSheet;
