/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Точные цвета из Figma (на основе скриншота)
        bg: {
          main: '#1a1a1a',      // Основной фон
          sidebar: '#2a2a2a',   // Фон сайдбара
          chat: '#1f1f1f',      // Фон чата
          hover: '#333333',     // Ховер
          active: '#404040',    // Активный элемент
        },
        text: {
          primary: '#ffffff',
          secondary: '#aaaaaa',
          muted: '#666666',
        },
        accent: {
          blue: '#3b82f6',      // Синий акцент
          green: '#22c55e',     // Онлайн статус
        },
        border: '#333333',
      },
      spacing: {
        'sidebar': '380px',     // Фиксированная ширина сайдбара
      }
    },
  },
  plugins: [],
}