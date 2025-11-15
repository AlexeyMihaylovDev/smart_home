/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f0f0f',
          card: '#1a1a1a',
          cardHover: '#252525',
          border: '#2a2a2a',
          text: '#e0e0e0',
          textSecondary: '#a0a0a0',
        }
      }
    },
  },
  plugins: [],
}


