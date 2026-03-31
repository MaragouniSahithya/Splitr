import { useState } from "react";
import { X, Mail, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { avatarColor } from "../common/utils";

/**
 * Renders the group name, description, member avatar strip, and Invite button.
 *
 * Props:
 *  - group         : group object
 *  - isAdmin       : boolean
 *  - onInviteClick : () => void
 */
const GroupHeader = ({ group, isAdmin, onInviteClick }) => {
  const [showMembers, setShowMembers] = useState(false);

  return (
    <>
      <section className="bg-white/5 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            {/* Title strip */}
            <div className="w-10 h-1.5 rounded-full bg-splitr-mint mb-3" />
            <h1 className="text-2xl font-bold text-white">{group.name}</h1>
            {group.description && (
              <p className="text-slate-400 mt-1 text-sm">{group.description}</p>
            )}

            {/* Member avatars — clickable to open members modal */}
            <div className="flex items-center mt-4 gap-2 flex-wrap">
              <div
                className="flex -space-x-2 cursor-pointer group"
                onClick={() => setShowMembers(true)}
                title="View members"
              >
                {group.members?.slice(0, 8).map((m) => {
                  const name = m.userId?.name || "?";
                  return (
                    <div
                      key={m._id}
                      title={name}
                      className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center ring-2 ring-splitr-midnight transition-transform group-hover:scale-110 ${avatarColor(name)}`}
                    >
                      {name[0]?.toUpperCase()}
                    </div>
                  );
                })}
                {group.members?.length > 8 && (
                  <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center ring-2 ring-splitr-midnight">
                    +{group.members.length - 8}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowMembers(true)}
                className="text-xs text-splitr-mint hover:text-white transition-colors ml-1 underline-offset-2 hover:underline"
              >
                {group.members?.length} member{group.members?.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>

          {/* Invite button — visible to ALL members */}
          <button
            onClick={onInviteClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-splitr-midnight bg-splitr-mint hover:bg-[#4df0c9] rounded-lg transition shadow-sm self-start active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Invite Member
          </button>
        </div>
      </section>

      {/* ── Members Modal ── */}
      <AnimatePresence>
        {showMembers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowMembers(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="glass-panel w-full max-w-md p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-splitr-mint" />
                  Members ({group.members?.length || 0})
                </h2>
                <button
                  onClick={() => setShowMembers(false)}
                  className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Members list */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1 scrollbar-hide">
                {group.members?.map((m) => {
                  const name = m.userId?.name || "Unknown";
                  const email = m.userId?.email || "";
                  const initial = name[0]?.toUpperCase();
                  return (
                    <div
                      key={m._id}
                      className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5 hover:border-splitr-mint/30 transition-colors"
                    >
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full text-white text-sm font-bold flex items-center justify-center shrink-0 ${avatarColor(name)}`}>
                        {initial}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-semibold text-sm truncate">{name}</p>
                          {m.role === "admin" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-splitr-mint/20 text-splitr-mint font-bold border border-splitr-mint/30 shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        {email && (
                          <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5 truncate">
                            <Mail className="w-3 h-3 shrink-0" />
                            {email}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer: invite button (for admins) */}
              {isAdmin && (
                <button
                  onClick={() => { setShowMembers(false); onInviteClick(); }}
                  className="mt-4 w-full py-2.5 rounded-xl bg-splitr-mint text-splitr-midnight font-bold text-sm hover:bg-[#4df0c9] transition-colors active:scale-[0.98]"
                >
                  + Invite New Member
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GroupHeader;
