// تم تعطيل هذا الملف. الرجاء استخدام tailwind.config.ts فقط.
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundColor: {
        'physics-dark': '#0E1525', // Match the CSS variable and tailwind.config.ts
        'physics-navy': '#171E31',
        'physics-gold': '#D4AF37',
        'physics-lightgold': '#fbbf24',
      },
      textColor: {
        'physics-lightgold': '#fbbf24',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.rtl': {
          direction: 'rtl',
        },
        '.text-physics-lightgold': {
          color: 'var(--physics-lightgold)',
        },
      };
      addUtilities(newUtilities, ['utilities']);
    }
  ],
}
