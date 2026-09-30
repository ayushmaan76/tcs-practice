/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tcs: {
          dark: "#1e293b",
          primary: "#0f172a",
          accent: "#2563eb",
          header: "#0f172a",
          panel: "#1e293b",
          border: "#334155",
          highlight: "#3b82f6"
        }
      }
    },
  },
  plugins: [],
}
