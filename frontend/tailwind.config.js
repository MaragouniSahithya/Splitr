/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        splitr: {
          midnight: "#0a192f",
          navy: "#112240",
          lightnavy: "#233554",
          mint: "#64ffda",
          neonred: "#ff3366",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-inset": "inset 0 2px 4px 0 rgba(255, 255, 255, 0.1)",
      },
    },
  },
  plugins: [],
};
