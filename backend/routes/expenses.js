import express from "express";
import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import ExpenseSplit from "../models/ExpenseSplit.js";
import Settlement from "../models/Settlement.js";
import GroupMember from "../models/GroupMember.js";
import Group from "../models/Group.js";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";
import calculateBalances from "../utils/calculateBalances.js";
import simplifyDebts from "../utils/simplifyDebts.js";

const router = express.Router();

router.use(authMiddleware);

// ── Helper: verify user is an accepted group member ────────────────────────
const getAcceptedMembership = (groupId, userId) =>
  GroupMember.findOne({ groupId, userId, status: "accepted" });

// ── POST /api/expenses ─────────────────────────────────────────────────────
// Create an expense and its splits (equal or custom)
router.post("/", async (req, res) => {
  const {
    groupId,
    description,
    amount,
    categoryId,
    splitType,
    splits,
    isRecurring,
    recurringInterval,
    date,
  } = req.body;

  if (!groupId || !description || amount == null || !splitType) {
    return res.status(400).json({ message: "groupId, description, amount, and splitType are required" });
  }

  try {
    const membership = await getAcceptedMembership(groupId, req.userId);
    if (!membership) {
      return res.status(403).json({ message: "Access denied" });
    }

    const expense = await Expense.create({
      groupId,
      paidBy: req.userId,
      description,
      amount,
      categoryId: categoryId || null,
      isRecurring: isRecurring ?? false,
      recurringInterval: recurringInterval ?? null,
      date: date ? new Date(date) : Date.now(),
    });

    let expenseSplits = [];

    if (splitType === "equal") {
      // Divide evenly among all accepted members
      const members = await GroupMember.find({ groupId, status: "accepted" });
      const share = Math.round((amount / members.length) * 100) / 100;

      expenseSplits = await ExpenseSplit.insertMany(
        members.map((m) => ({
          expenseId: expense._id,
          userId: m.userId,
          amount: share,
        }))
      );
    } else if (splitType === "custom") {
      if (!Array.isArray(splits) || splits.length === 0) {
        return res.status(400).json({ message: "splits array is required for custom split" });
      }
      expenseSplits = await ExpenseSplit.insertMany(
        splits.map(({ userId, amount: splitAmt }) => ({
          expenseId: expense._id,
          userId,
          amount: splitAmt,
        }))
      );
    } else {
      return res.status(400).json({ message: "splitType must be 'equal' or 'custom'" });
    }

    // Populate paidBy and categoryId so the frontend can display the name immediately
    const populated = await Expense.findById(expense._id)
      .populate("paidBy", "name email")
      .populate("categoryId", "name color");

    res.status(201).json({ expense: populated, splits: expenseSplits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/expenses/group/:groupId ───────────────────────────────────────
// List expenses for a group with optional filters
router.get("/group/:groupId", async (req, res) => {
  const { groupId } = req.params;
  const { categoryId, startDate, endDate, userId } = req.query;

  try {
    const membership = await getAcceptedMembership(groupId, req.userId);
    if (!membership) {
      return res.status(403).json({ message: "Access denied" });
    }

    const filter = { groupId };
    if (categoryId) filter.categoryId = categoryId;
    if (userId) filter.paidBy = userId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
      .populate("paidBy", "name email")
      .populate("categoryId", "name color")
      .sort({ date: -1 });

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/expenses/group/:groupId/balances ──────────────────────────────
// Return per-user net balances, simplified transactions, and budget summary
router.get("/group/:groupId/balances", async (req, res) => {
  const { groupId } = req.params;

  try {
    const membership = await getAcceptedMembership(groupId, req.userId);
    if (!membership) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Run balance calc and budget query in parallel
    const [balances, group, spentAgg] = await Promise.all([
      calculateBalances(groupId),
      Group.findById(groupId, "budget budgetUnit"),
      Expense.aggregate([
        { $match: { groupId: new mongoose.Types.ObjectId(groupId) } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const transactions  = simplifyDebts(balances);
    const totalSpent    = spentAgg[0]?.total ?? 0;
    const budget        = group?.budget ?? 0;
    const budgetUnit    = group?.budgetUnit ?? "total";
    const budgetPercent = budget > 0
      ? Math.min(Math.round((totalSpent / budget) * 100), 100)
      : 0;

    res.json({ balances, transactions, totalSpent, budget, budgetUnit, budgetPercent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/expenses/my ───────────────────────────────────────────────────
// Return all expenses the logged-in user has a split in
router.get("/my", async (req, res) => {
  const { startDate, endDate, groupId } = req.query;

  try {
    // Find all this user's splits
    const userSplits = await ExpenseSplit.find({ userId: req.userId });
    const expenseIds = userSplits.map((s) => s.expenseId);

    const filter = { _id: { $in: expenseIds } };
    if (groupId) filter.groupId = groupId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
      .populate("paidBy", "name email")
      .populate("groupId", "name")
      .populate("categoryId", "name color")
      .sort({ date: -1 });

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/expenses/settle ──────────────────────────────────────────────
// Record a manual settlement between two members
router.post("/settle", async (req, res) => {
  const { groupId, toUserId, amount } = req.body;

  if (!groupId || !toUserId || amount == null) {
    return res.status(400).json({ message: "groupId, toUserId, and amount are required" });
  }

  try {
    // Verify both users are accepted members
    const [fromMembership, toMembership] = await Promise.all([
      getAcceptedMembership(groupId, req.userId),
      getAcceptedMembership(groupId, toUserId),
    ]);

    if (!fromMembership) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }
    if (!toMembership) {
      return res.status(400).json({ message: "Target user is not a member of this group" });
    }

    const settlement = await Settlement.create({
      groupId,
      fromUser: req.userId,
      toUser: toUserId,
      amount,
    });

    res.status(201).json(settlement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
