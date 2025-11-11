/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#60A5FA",
          DEFAULT: "#1D4ED8",
          dark: "#1E3A8A"
        }
      },
      boxShadow: {
        glow: "0 0 20px rgba(96, 165, 250, 0.35)"
      }
    }
  },
  plugins: []
};
