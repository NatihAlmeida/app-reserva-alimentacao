/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': {
          50: '#EAF6F2',
          100: '#CFE9E1',
          200: '#A9D8CB',
          300: '#78C0AD',
          400: '#3A9D87',
          500: '#007866',
          600: '#006E5D',
          700: '#005F51',
          800: '#0B443A',
          900: '#07362E',
        },
        'cantina-yellow': '#FFC20A',
        'cantina-red': '#E63946',
        'cantina-green': '#007866',
        'cantina-mint': '#EFF8F5',
        'cantina-beige': '#F4FBF8',
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        scaleIn: 'scaleIn 0.2s ease-out',
        slideIn: 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
