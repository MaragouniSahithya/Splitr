/** Formats a number with Indian locale, 2 decimal places */
export const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(
    Math.abs(n)
  );

/** Returns today as YYYY-MM-DD */
export const today = () => new Date().toISOString().slice(0, 10);

/** Deterministic pastel Tailwind colour class from a string */
export const avatarColor = (str = "") => {
  const palette = [
    "bg-indigo-500",
    "bg-violet-500",
    "bg-pink-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-emerald-500",
    "bg-sky-500",
    "bg-fuchsia-500",
  ];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
};
