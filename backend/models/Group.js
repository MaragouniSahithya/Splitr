import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  budget: {
    type: Number,
    default: 0,
  },
  budgetUnit: {
    type: String,
    enum: ["total", "per_person"],
    default: "total",
  },
  heroImage: {
    type: String,
    default: "",
  },
  statusUpdates: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      text: { type: String, trim: true },
      imageUrl: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  memories: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      imageUrl: { type: String, required: true },
      caption: { type: String, trim: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Group = mongoose.model("Group", groupSchema);

export default Group;
