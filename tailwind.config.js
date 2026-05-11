/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F766E',
          light: '#14B8A6',
          lighter: '#CCFBF1',
        },
        success: {
          DEFAULT: '#059669',
          light: '#D1FAE5',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        },
        background: {
          DEFAULT: '#F8FAFC',
          alt: '#F1F5F9',
        },
        card: '#FFFFFF',
        text: {
          primary: '#0F172A',
          secondary: '#0F172A',
          muted: '#475569',
          light: '#94A3B8',
        },
        border: {
          DEFAULT: '#E2E8F0',
          focus: '#0F766E',
        },
      },
    },
  },
  plugins: [],
};
