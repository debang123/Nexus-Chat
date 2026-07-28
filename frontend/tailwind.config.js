/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wa: {
          green: '#00a884',
          'green-dark': '#008069',
          'green-light': '#25d366',
          teal: '#128c7e',
          bg: '#efeae2',
          'bg-dark': '#0b141a',
          'panel-dark': '#111b21',
          'panel-light': '#f0f2f5',
          'header-dark': '#202c33',
          'header-light': '#f0f2f5',
          'input-dark': '#2a3942',
          'bubble-sent-dark': '#005c4b',
          'bubble-sent-light': '#d9fdd3',
          'bubble-recv-dark': '#202c33',
          'bubble-recv-light': '#ffffff',
          'hover-dark': '#222e35',
          'border-dark': '#222d34',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'Helvetica Neue', 'Helvetica', 'Lucida Grande', 'Arial', 'Ubuntu', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
