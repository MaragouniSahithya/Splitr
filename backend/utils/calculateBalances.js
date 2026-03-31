import Expense from "../models/Expense.js";
import ExpenseSplit from "../models/ExpenseSplit.js";
import Settlement from "../models/Settlement.js";

/**
 * calculateBalances
 * Returns a net balance map { userId: netAmount } for a group.
 *
 * For each ExpenseSplit:
 *   - expense.paidBy += split.amount  (paidBy is owed this by the splitter)
 *   - split.userId   -= split.amount  (splitter owes this to paidBy)
 *   - Skip if split.userId === expense.paidBy (no self-debt)
 *
 * For each Settlement:
 *   - fromUser += amount  (they paid, reducing what they owe)
 *   - toUser   -= amount  (they received, reducing what they're owed)
 */
const calculateBalances = async (groupId) => {
  const balances = {};

  const add = (userId, value) => {
    const key = userId.toString();
    balances[key] = (balances[key] ?? 0) + value;
  };

  // ── Build a lookup map for expenses in this group ─────────────────────────
  const expenses = await Expense.find({ groupId });
  const expenseMap = new Map(expenses.map((e) => [e._id.toString(), e]));
  const expenseIds = expenses.map((e) => e._id);

  // ── Process each split ────────────────────────────────────────────────────
  const splits = await ExpenseSplit.find({ expenseId: { $in: expenseIds } });

  for (const split of splits) {
    const expense = expenseMap.get(split.expenseId.toString());
    if (!expense) continue;

    // Skip self-splits — the payer doesn't owe themselves
    if (split.userId.toString() === expense.paidBy.toString()) continue;

    add(expense.paidBy, split.amount);  // paidBy is owed this amount
    add(split.userId, -split.amount);   // splitter owes this amount
  }

  // ── Apply settlements ─────────────────────────────────────────────────────
  const settlements = await Settlement.find({ groupId });

  for (const settlement of settlements) {
    add(settlement.fromUser, settlement.amount);  // paid → reduce debt
    add(settlement.toUser, -settlement.amount);   // received → reduce credit
  }

  return balances;
};

export default calculateBalances;
