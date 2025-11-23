/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
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
        },
        light: {
          bg: '#ffffff',
          card: '#f5f5f5',
          cardHover: '#e8e8e8',
          border: '#d4d4d4',
          text: '#1f1f1f',
          textSecondary: '#6b7280',
        }
      }
    },
  },
  plugins: [],
}


