/* Shared Tailwind class strings used by all modal components */
export const inputCls =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition";
export const labelCls = "block text-sm font-medium text-gray-700 mb-1";
export const btnPrimary =
  "flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition";
export const btnSecondary =
  "flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition";

/** Tiny inline error banner */
export const ErrorBanner = ({ msg }) =>
  msg ? (
    <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
      {msg}
    </p>
  ) : null;

/** Backdrop + white card wrapper shared by all modals */
const ModalShell = ({ title, onClose, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 relative max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default ModalShell;
