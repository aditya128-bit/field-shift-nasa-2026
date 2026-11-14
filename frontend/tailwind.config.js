/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nasa: {
          blue: "#0B3D91",
          red: "#FC3D21",
          dark: "#0a1128",
          card: "#111827",
          accent: "#00E5FF",
          earth: "#2E7D32"
        }
      }
    },
  },
  plugins: [],
}
