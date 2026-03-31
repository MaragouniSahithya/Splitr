/**
 * simplifyDebts
 * Takes a balances map { userId: netAmount } and returns a minimal
 * list of transactions { from, to, amount } that settles all debts.
 *
 * Positive balance  → user is owed money (creditor)
 * Negative balance  → user owes money   (debtor)
 */
const simplifyDebts = (balances) => {
  const transactions = [];

  // Build mutable creditor / debtor lists
  const creditors = [];
  const debtors = [];

  for (const [userId, amount] of Object.entries(balances)) {
    if (amount > 0.001) creditors.push({ userId, amount });
    else if (amount < -0.001) debtors.push({ userId, amount });
  }

  // Sort descending by absolute amount for greedy matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => a.amount - b.amount); // most negative first

  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];

    const settle = Math.min(creditor.amount, Math.abs(debtor.amount));

    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: Math.round(settle * 100) / 100, // round to 2 dp
    });

    creditor.amount -= settle;
    debtor.amount += settle;

    if (Math.abs(creditor.amount) < 0.001) creditors.shift();
    if (Math.abs(debtor.amount) < 0.001) debtors.shift();
  }

  return transactions;
};

export default simplifyDebts;
