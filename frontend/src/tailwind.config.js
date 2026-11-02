/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B2434",
        paper: "#FAF6EE",
        line: "#E7DFCD",
        terre: { DEFAULT: "#C1602B", dark: "#A34F22" },
        foret: { DEFAULT: "#5C9575", dark: "#477357" },
        or: "#E3B23C",
      },
      fontFamily: {
        serif: ["Fraunces", "serif"],
        sans: ["IBM Plex Sans", "ui-sans-serif", "system-ui"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
