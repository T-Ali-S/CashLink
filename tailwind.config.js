/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors:{
        gold100: '#FFD700',
        gold200:'#D4AF37',
      },
  animation: {
    'slide-in': 'slideIn 0.3s ease-out',
  },
  keyframes: {
    slideIn: {
      '0%': { opacity: 0, transform: 'translateX(100%)' },
      '100%': { opacity: 1, transform: 'translateX(0)' },
    },
  },
}
,
  },
  plugins: [],
}

