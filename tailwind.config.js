/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/web/views/**/*.html",
    "./src/web/public/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        'arctic-blue': '#0a1628',
        'aurora-green': '#00ff9d',
        'aurora-blue': '#00d4ff',
        'aurora-purple': '#b47aff',
        'snow-white': '#f0f9ff',
        'ice-blue': '#c0e5ff',
        'dark-sky': '#020814',
      },
      animation: {
        'aurora-dance': 'auroraDance 20s ease-in-out infinite',
        'snowfall': 'snowfall 20s linear infinite',
        'twinkle': 'twinkle 4s ease-in-out infinite',
      },
      keyframes: {
        auroraDance: {
          '0%, 100%': { transform: 'translateX(0) translateY(0) scaleY(1)', opacity: '0.4' },
          '33%': { transform: 'translateX(-10%) translateY(-20px) scaleY(1.3)', opacity: '0.6' },
          '66%': { transform: 'translateX(10%) translateY(10px) scaleY(0.9)', opacity: '0.5' },
        },
        snowfall: {
          '0%': { transform: 'translateY(-10px) translateX(0) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '0.8' },
          '100%': { transform: 'translateY(100vh) translateX(var(--drift, 0)) rotate(360deg)', opacity: '0' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
}
