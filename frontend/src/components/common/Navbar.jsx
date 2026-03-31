import { Link } from "react-router-dom";

/**
 * Shared top navigation bar used by GroupPage, DashboardPage, and MyExpensesPage.
 *
 * Props:
 *  - user          : auth user object ({ name })
 *  - onLogout      : () => void
 *  - centerContent : optional JSX rendered in the horizontal centre slot
 */
const Navbar = ({ user, onLogout, centerContent }) => (
  <nav className="bg-white shadow-sm sticky top-0 z-40">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
      {/* Logo */}
      <Link
        to="/dashboard"
        className="text-2xl font-extrabold text-indigo-600 tracking-tight shrink-0"
      >
        Splitr
      </Link>

      {/* My Expenses link */}
      <Link
        to="/expenses/my"
        className="text-sm text-gray-500 hover:text-indigo-600 transition shrink-0 hidden sm:block"
      >
        My Expenses
      </Link>

      {/* Optional centre slot (e.g. group name) */}
      <div className="flex-1 text-center">
        {centerContent && (
          <span className="text-base font-semibold text-gray-700 truncate">
            {centerContent}
          </span>
        )}
      </div>

      {/* Right — username + logout */}
      <div className="flex items-center gap-3 shrink-0">
        {user && (
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            👋 {user.name}
          </span>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 px-3 py-2 rounded-lg transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  </nav>
);

export default Navbar;
