/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app-bg': '#1e1e1e',
        'panel-bg': '#252526',
        'accent': '#007acc',
        'accent-hover': '#1f8ad2',
        'selected': '#094771',
        'hover': '#2a2d2e',
        'text-primary': '#cccccc',
      },
      width: {
        'left-panel': '250px',
      },
      height: {
        'video-item': '48px',
      }
    },
  },
  plugins: [],
}