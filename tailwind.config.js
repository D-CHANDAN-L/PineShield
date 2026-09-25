/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pine: {
          50: '#E8F8F0',
          100: '#C7EED8',
          400: '#10B981',
          DEFAULT: '#00A859', // Official Pine Labs Green
          hover: '#008F4C',
          dark: '#00843D',
          emerald: '#00382B', // Pine Deep Emerald
          deep: '#004733',
          forest: '#003D2B',
          lime: '#D4F94C', // Pine Lime CTA accent
          limeHover: '#C8F93B',
          slate: '#0B0F17',
          canvasDark: '#0B1311',
          surface: '#161D2B',
          surfaceElevated: '#1E293B',
          card: '#1F293D',
          border: '#243044',
          // Light Mode semantic tokens
          canvasLight: '#F8FAFC',
          cardLight: '#FFFFFF',
          borderLight: '#E2E8F0',
          textLight: '#0F172A',
          mutedLight: '#475569'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
