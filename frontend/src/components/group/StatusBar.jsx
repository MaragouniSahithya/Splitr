import { useState } from "react";
import { Plus, Image as ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../lib/axios";

const StatusBar = ({ groupId, updates = [], onUpdateAdded }) => {
  const [showInput, setShowInput] = useState(false);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // For status detail viewer
  const [viewingStatus, setViewingStatus] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearFile = () => {
    setImageFile(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imageFile) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      if (text.trim()) formData.append("text", text.trim());
      if (imageFile)  formData.append("image", imageFile);

      const res = await api.post(
        `/api/groups/${groupId}/statuses`,
        formData
      );

      if (onUpdateAdded) onUpdateAdded(res.data.statusUpdate);
      setText("");
      clearFile();
      setShowInput(false);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to post status.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  return (
    <div className="w-full relative mb-6">
      {/* ── Story-style bubble row ── */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide items-center">
        {/* Add Status trigger */}
        <button
          onClick={() => setShowInput((v) => !v)}
          className="relative flex flex-col items-center gap-2 group shrink-0"
        >
          <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center border-2 border-dashed border-splitr-mint/50 group-hover:border-splitr-mint transition-all group-active:scale-95 shadow-[0_0_15px_rgba(100,255,218,0.2)] group-hover:shadow-[0_0_20px_rgba(100,255,218,0.5)] cursor-pointer">
            <Plus className="text-splitr-mint w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-slate-300">Add Status</span>
        </button>

        {/* Existing status bubbles — clickable to view detail */}
        {updates.map((update, idx) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            key={update._id || idx}
            className="flex flex-col items-center gap-2 cursor-pointer group shrink-0"
            title={update.text || update.user?.name}
            onClick={() => setViewingStatus(update)}
          >
            {/* Ring glow to indicate clickable */}
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-splitr-mint to-teal-500 shadow-[0_0_15px_rgba(100,255,218,0.4)] transition-all group-hover:scale-110 group-hover:shadow-[0_0_22px_rgba(100,255,218,0.7)] group-active:scale-95 ring-0 group-hover:ring-2 group-hover:ring-splitr-mint/60">
              <div className="w-full h-full rounded-full bg-splitr-navy border-2 border-splitr-midnight overflow-hidden">
                {update.imageUrl ? (
                  <img src={update.imageUrl} alt="status" className="w-full h-full object-cover" />
                ) : update.user?.avatarUrl ? (
                  <img src={update.user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-700 font-bold flex items-center justify-center text-white text-lg">
                    {update.user?.name?.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs font-medium text-slate-300 w-16 text-center truncate">
              {update.user?.name?.split(" ")[0]}
            </span>
          </motion.div>
        ))}
      </div>

      {/* ── Composer panel ── */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel p-4 absolute top-24 left-0 z-20 w-full sm:w-96 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
          >
            {error && (
              <p className="mb-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What's happening on the trip?"
                className="w-full bg-black/20 text-white placeholder-slate-400 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-splitr-mint border border-white/5"
                rows={2}
              />

              {/* Image preview */}
              {preview && (
                <div className="relative w-full rounded-xl overflow-hidden border border-white/10">
                  <img src={preview} alt="preview" className="w-full max-h-40 object-cover" />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-center justify-between">
                <label className="cursor-pointer flex items-center gap-2 text-splitr-mint hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-xs font-semibold">
                  <ImageIcon className="w-4 h-4" />
                  {imageFile ? "Change Image" : "Attach Image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading || (!text.trim() && !imageFile)}
                  className="bg-splitr-mint text-splitr-midnight px-5 py-1.5 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-[#4df0c9] active:scale-95 transition-all"
                >
                  {loading ? "Posting…" : "Post"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Status Detail Modal ── */}
      <AnimatePresence>
        {viewingStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewingStatus(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="glass-panel w-full max-w-sm p-0 overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Status image (if any) */}
              {viewingStatus.imageUrl && (
                <div className="w-full max-h-72 overflow-hidden">
                  <img
                    src={viewingStatus.imageUrl}
                    alt="status"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-5">
                {/* Author info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-splitr-mint to-teal-500 p-[2px] shrink-0">
                    <div className="w-full h-full rounded-full bg-splitr-navy flex items-center justify-center overflow-hidden">
                      {viewingStatus.user?.avatarUrl ? (
                        <img src={viewingStatus.user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {viewingStatus.user?.name?.charAt(0) || "?"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{viewingStatus.user?.name || "Unknown"}</p>
                    <p className="text-slate-400 text-xs">{formatDate(viewingStatus.createdAt)}</p>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => setViewingStatus(null)}
                    className="ml-auto text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status text */}
                {viewingStatus.text && (
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {viewingStatus.text}
                  </p>
                )}

                {/* Close CTA */}
                <button
                  onClick={() => setViewingStatus(null)}
                  className="mt-5 w-full py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatusBar;
