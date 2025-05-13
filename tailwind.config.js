/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Enhanced contrast variants for accessibility
        'accessible': {
          gray: {
            light: '#6B7280', // Meets 4.5:1 on white backgrounds
            muted: '#4B5563', // Stronger gray for smaller text
          },
          indigo: {
            DEFAULT: '#4F46E5', // indigo-600
            soft: '#6366F1',    // indigo-500 (improved from indigo-400)
          }
        }
      },
    },
  },
  plugins: [],
}

