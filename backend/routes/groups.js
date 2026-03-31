import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Group from "../models/Group.js";
import GroupMember from "../models/GroupMember.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

// ── Local disk storage (used when Cloudinary credentials are absent) ──────────
// Files land in  backend/uploads/  and are served as /uploads/<filename>
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const stem = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${stem}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB cap
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) return cb(null, true);
    cb(new Error("Only image files are allowed"));
  },
});

/** Build a public URL from the saved filename, falling back to localhost. */
const buildFileUrl = (req, filename) => {
  const base = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${base}/uploads/${filename}`;
};

// All routes require authentication
router.use(authMiddleware);

// Default categories seeded for every new group
const DEFAULT_CATEGORIES = [
  { name: "Food", color: "#f97316" },
  { name: "Travel", color: "#06b6d4" },
  { name: "Stay", color: "#8b5cf6" },
  { name: "Shopping", color: "#ec4899" },
  { name: "Other", color: "#6b7280" },
];

// ─── POST /api/groups ─────────────────────────────────────────────────────────
// Create a new group, add creator as admin, seed default categories
router.post("/", async (req, res) => {
  const { name, description, budget, budgetUnit } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Group name is required" });
  }

  try {
    const group = await Group.create({
      name,
      description,
      budget,
      budgetUnit,
      createdBy: req.userId,
    });

    // Add creator as admin member
    await GroupMember.create({
      groupId: group._id,
      userId: req.userId,
      role: "admin",
      status: "accepted",
    });

    // Seed default categories
    await Category.insertMany(
      DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        groupId: group._id,
        createdBy: req.userId,
      }))
    );

    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/groups ──────────────────────────────────────────────────────────
// Get all groups the current user has accepted membership in
router.get("/", async (req, res) => {
  try {
    const memberships = await GroupMember.find({
      userId: req.userId,
      status: "accepted",
    }).populate("groupId");

    const groups = memberships.map((m) => m.groupId).filter(Boolean);

    // Attach memberCount to each group in parallel
    const groupsWithCount = await Promise.all(
      groups.map(async (group) => {
        const memberCount = await GroupMember.countDocuments({
          groupId: group._id,
          status: "accepted",
        });
        return { ...group.toObject(), memberCount };
      })
    );

    res.json(groupsWithCount);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/groups/invites ──────────────────────────────────────────────────
// Get all pending invites for the current user
router.get("/invites", async (req, res) => {
  try {
    const invites = await GroupMember.find({
      userId: req.userId,
      status: "pending",
    }).populate({
      path: "groupId",
      select: "name description createdBy",
      populate: { path: "createdBy", select: "name email" },
    });

    res.json(invites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/groups/invites/:groupId/respond ────────────────────────────────
// Accept or reject a pending invite
router.post("/invites/:groupId/respond", async (req, res) => {
  const { action } = req.body;

  if (!["accept", "reject"].includes(action)) {
    return res.status(400).json({ message: "Action must be 'accept' or 'reject'" });
  }

  try {
    const membership = await GroupMember.findOne({
      groupId: req.params.groupId,
      userId: req.userId,
      status: "pending",
    });

    if (!membership) {
      return res.status(404).json({ message: "Invite not found" });
    }

    membership.status = action === "accept" ? "accepted" : "rejected";
    await membership.save();

    res.json({
      message: action === "accept" ? "Invite accepted" : "Invite rejected",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/groups/:id ──────────────────────────────────────────────────────
// Get a single group with all accepted members populated
router.get("/:id", async (req, res) => {
  try {
    const membership = await GroupMember.findOne({
      groupId: req.params.id,
      userId: req.userId,
      status: "accepted",
    });

    if (!membership) {
      return res.status(403).json({ message: "Access denied" });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const members = await GroupMember.find({
      groupId: req.params.id,
      status: "accepted",
    }).populate("userId", "name email avatarUrl");

    res.json({ ...group.toObject(), members });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/groups/:id/invite ─────────────────────────────────────────────
// Admin invites a user by email
router.post("/:id/invite", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Only admins can invite
    const requesterMembership = await GroupMember.findOne({
      groupId: req.params.id,
      userId: req.userId,
      status: "accepted",
    });

    if (!requesterMembership || requesterMembership.role !== "admin") {
      return res.status(403).json({ message: "Only admins can invite members" });
    }

    const invitee = await User.findOne({ email: email.toLowerCase() });
    if (!invitee) {
      return res.status(404).json({ message: "User not found" });
    }

    const existing = await GroupMember.findOne({
      groupId: req.params.id,
      userId: invitee._id,
    });

    if (existing) {
      return res.status(400).json({ message: "User is already a member or has a pending invite" });
    }

    const group = await Group.findById(req.params.id);

    await GroupMember.create({
      groupId: req.params.id,
      userId: invitee._id,
      role: "member",
      status: "pending",
    });

    // Send invitation email (fire-and-forget — don't block the response)
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    sendEmail({
      to: invitee.email,
      subject: `You've been invited to join "${group?.name || "a group"}" on Splitr`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
        <body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <tr><td style="background:linear-gradient(135deg,#0a192f,#112240);padding:36px 48px;text-align:center;">
                  <h1 style="margin:0;color:#64ffda;font-size:32px;font-weight:800;letter-spacing:-1px;">Splitr</h1>
                  <p style="margin:6px 0 0;color:#8892b0;font-size:14px;">Split expenses. Stay friends.</p>
                </td></tr>
                <tr><td style="padding:44px 48px;">
                  <h2 style="margin:0 0 12px;color:#1e1b4b;font-size:22px;font-weight:700;">You've been invited!</h2>
                  <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
                    You've been invited to join <strong>${group?.name || "a group"}</strong> on Splitr.
                    Log in to accept or reject this invite.
                  </p>
                  <div style="text-align:center;margin-bottom:32px;">
                    <a href="${clientUrl}/dashboard"
                       style="display:inline-block;background:linear-gradient(135deg,#64ffda,#0ea5e9);color:#0a192f;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;">
                      View Invite
                    </a>
                  </div>
                  <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;border-top:1px solid #e5e7eb;padding-top:24px;">
                    If you did not expect this invite, you can safely ignore this email.
                  </p>
                </td></tr>
                <tr><td style="background:#f9fafb;padding:20px 48px;text-align:center;">
                  <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; 2025 Splitr. All rights reserved.</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    }).catch(() => {}); // Silently ignore email errors — invite is still created

    res.json({ message: "Invite sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/groups/:id/budget ───────────────────────────────────────────────
// Admin updates group budget
router.put("/:id/budget", async (req, res) => {
  const { budget, budgetUnit } = req.body;

  try {
    const membership = await GroupMember.findOne({
      groupId: req.params.id,
      userId: req.userId,
      status: "accepted",
    });

    if (!membership || membership.role !== "admin") {
      return res.status(403).json({ message: "Only admins can update the budget" });
    }

    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { budget, budgetUnit },
      { new: true }
    );

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/groups/:id/categories ──────────────────────────────────────────
// Get all categories for a group (members only)
router.get("/:id/categories", async (req, res) => {
  try {
    const membership = await GroupMember.findOne({
      groupId: req.params.id,
      userId: req.userId,
      status: "accepted",
    });

    if (!membership) {
      return res.status(403).json({ message: "Access denied" });
    }

    const categories = await Category.find({ groupId: req.params.id });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/groups/:id/categories ─────────────────────────────────────────
// Add a custom category (members only)
router.post("/:id/categories", async (req, res) => {
  const { name, color } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  try {
    const membership = await GroupMember.findOne({
      groupId: req.params.id,
      userId: req.userId,
      status: "accepted",
    });

    if (!membership) {
      return res.status(403).json({ message: "Access denied" });
    }

    const category = await Category.create({
      groupId: req.params.id,
      name,
      color,
      createdBy: req.userId,
    });

    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/groups/:id/statuses ───────────────────────────────────────────
router.post("/:id/statuses", upload.single("image"), async (req, res) => {

  try {
    const membership = await GroupMember.findOne({
      groupId: req.params.id,
      userId: req.userId,
      status: "accepted",
    });
    if (!membership) return res.status(403).json({ message: "Access denied" });

    const { text } = req.body;
    const imageUrl = req.file ? buildFileUrl(req, req.file.filename) : (req.body.imageUrl || null);

    if (!text && !imageUrl)
      return res.status(400).json({ message: "Status must have text or an image" });

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    group.statusUpdates.unshift({
      user: req.userId,
      text: text || "",
      imageUrl: imageUrl,
      createdAt: new Date(),
    });
    await group.save();

    const saved = await Group.findById(req.params.id)
      .select("statusUpdates")
      .populate("statusUpdates.user", "name email avatarUrl");

    res.status(201).json({ statusUpdate: saved.statusUpdates[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/groups/:id/statuses ────────────────────────────────────────────
// Fetch all status updates for a group (members only)
router.get("/:id/statuses", async (req, res) => {
  try {
    const membership = await GroupMember.findOne({
      groupId: req.params.id,
      userId: req.userId,
      status: "accepted",
    });
    if (!membership) return res.status(403).json({ message: "Access denied" });

    const group = await Group.findById(req.params.id)
      .select("statusUpdates")
      .populate("statusUpdates.user", "name email avatarUrl");

    if (!group) return res.status(404).json({ message: "Group not found" });

    res.json(group.statusUpdates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/groups/:id/memories ───────────────────────────────────────────
router.post("/:id/memories", upload.single("image"), async (req, res) => {

  try {
    const membership = await GroupMember.findOne({
      groupId: req.params.id,
      userId: req.userId,
      status: "accepted",
    });
    if (!membership) return res.status(403).json({ message: "Access denied" });

    const imageUrl = req.file ? buildFileUrl(req, req.file.filename) : req.body.imageUrl;
    if (!imageUrl)
      return res.status(400).json({ message: "An image is required for a memory" });

    const { caption } = req.body;

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    group.memories.unshift({
      user: req.userId,
      imageUrl,
      caption: caption || "",
      createdAt: new Date(),
    });
    await group.save();

    const saved = await Group.findById(req.params.id)
      .select("memories")
      .populate("memories.user", "name email avatarUrl");

    res.status(201).json({ memory: saved.memories[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/groups/:id/memories ────────────────────────────────────────────
// Fetch all memories for a group (members only)
router.get("/:id/memories", async (req, res) => {
  try {
    const membership = await GroupMember.findOne({
      groupId: req.params.id,
      userId: req.userId,
      status: "accepted",
    });
    if (!membership) return res.status(403).json({ message: "Access denied" });

    const group = await Group.findById(req.params.id)
      .select("memories")
      .populate("memories.user", "name email avatarUrl");

    if (!group) return res.status(404).json({ message: "Group not found" });

    res.json(group.memories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PATCH /api/groups/:id/cover ─────────────────────────────────────────────
router.patch("/:id/cover", upload.single("image"), async (req, res) => {

  try {
    const membership = await GroupMember.findOne({
      groupId: req.params.id,
      userId: req.userId,
      status: "accepted",
    });
    if (!membership) return res.status(403).json({ message: "Access denied" });

    const heroImage = req.file ? buildFileUrl(req, req.file.filename) : req.body.heroImage;
    if (!heroImage)
      return res.status(400).json({ message: "An image is required" });

    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { heroImage },
      { new: true }
    );
    if (!group) return res.status(404).json({ message: "Group not found" });

    res.json({ heroImage: group.heroImage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
