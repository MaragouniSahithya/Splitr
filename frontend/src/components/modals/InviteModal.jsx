import { useState } from "react";
import ModalShell, { inputCls, labelCls, btnPrimary, btnSecondary, ErrorBanner } from "../common/ModalShell";
import api from "../../lib/axios";

/**
 * Props: groupId, onClose
 */
const InviteModal = ({ groupId, onClose }) => {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required."); return; }
    try {
      setLoading(true); setError("");
      await api.post(`/api/groups/${groupId}/invite`, { email: email.trim() });
      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send invite.");
    } finally { setLoading(false); }
  };

  return (
    <ModalShell title="Invite a Member" onClose={onClose}>
      {success && (
        <p className="mb-4 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
          ✅ Invite sent successfully!
        </p>
      )}
      <ErrorBanner msg={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@example.com"
            className={inputCls}
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? "Sending…" : "Send Invite"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default InviteModal;
