import mongoose from "mongoose";

const expenseSplitSchema = new mongoose.Schema({
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Expense",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  isSettled: {
    type: Boolean,
    default: false,
  },
});

// One split per user per expense
expenseSplitSchema.index({ expenseId: 1, userId: 1 }, { unique: true });

const ExpenseSplit = mongoose.model("ExpenseSplit", expenseSplitSchema);

export default ExpenseSplit;
