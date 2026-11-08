/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F2742",
        signal: { DEFAULT: "#2F6BFF", dark: "#2455D6" },
        sun: "#FFB020",
        paper: "#F2F5F9",
        line: "#D9E0EA",
        ok: "#1F9D6B",
        bad: "#D64545",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Instrument Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
