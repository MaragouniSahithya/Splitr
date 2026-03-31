import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Image as ImageIcon, X } from "lucide-react";
import api from "../../lib/axios";

const MemoriesGallery = ({ groupId, memories = [], onMemoryAdded }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedImg, setSelectedImg] = useState(null);

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
    if (!imageFile) return;
    setLoading(true);
    setError("");
    try {
      // Send image + caption as multipart — backend multer handles Cloudinary upload
      const formData = new FormData();
      formData.append("image", imageFile);
      if (caption.trim()) formData.append("caption", caption.trim());

      // Do NOT set Content-Type — let browser add the correct multipart boundary
      const res = await api.post(
        `/api/groups/${groupId}/memories`,
        formData
      );

      if (onMemoryAdded) onMemoryAdded(res.data.memory);
      setImageFile(null);
      setPreview(null);
      setCaption("");
      setShowUpload(false);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-wide">Trip Memories</h2>
        <button
          onClick={() => setShowUpload((v) => !v)}
          className="flex items-center gap-2 glass-button px-4 py-2 text-sm font-bold text-splitr-mint hover:text-white"
        >
          <Plus className="w-4 h-4" /> Add Memory
        </button>
      </div>

      {/* ── Upload form ── */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSubmit}
              className="glass-panel p-6 flex flex-col gap-4 mb-4"
            >
              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
                  {error}
                </p>
              )}

              <input
                type="text"
                placeholder="Caption this memory…"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-splitr-mint focus:ring-1 focus:ring-splitr-mint"
              />

              {/* Image picker / preview */}
              {preview ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full max-h-60 object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer glass-button border-dashed flex justify-center items-center gap-3 py-6 bg-white/5 text-slate-300 hover:text-white hover:border-splitr-mint/50 transition-all">
                  <ImageIcon className="w-6 h-6 text-splitr-mint" />
                  <span className="text-sm font-semibold">Select an Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowUpload(false); clearFile(); setCaption(""); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !imageFile}
                  className="flex-1 bg-splitr-mint text-splitr-midnight font-bold py-2.5 rounded-xl hover:bg-[#4df0c9] disabled:opacity-50 active:scale-95 transition-all"
                >
                  {loading ? "Uploading…" : "Upload"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Gallery grid ── */}
      {memories.length === 0 ? (
        <div className="glass-panel py-16 text-center text-slate-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No memories yet. Upload a photo to preserve the moment!</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
          {memories.map((mem, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              key={mem._id || idx}
              onClick={() => setSelectedImg(mem)}
              className="relative group break-inside-avoid rounded-2xl overflow-hidden cursor-pointer shadow-glass"
            >
              <img
                src={mem.imageUrl}
                alt={mem.caption || "memory"}
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-splitr-midnight/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <p className="text-white font-semibold text-sm drop-shadow-md">
                  {mem.caption || "A beautiful memory"}
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Added by {mem.user?.name}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Fullscreen lightbox ── */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            onClick={() => setSelectedImg(null)}
          >
            <img
              src={selectedImg.imageUrl}
              alt="full"
              className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-xl"
            />
            {selectedImg.caption && (
              <p className="text-white mt-6 text-xl tracking-wide font-medium text-center max-w-2xl">
                {selectedImg.caption}
              </p>
            )}
            <p className="text-slate-400 mt-2 text-sm">
              Uploaded by {selectedImg.user?.name}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemoriesGallery;
