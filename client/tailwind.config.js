/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, .04), 0 8px 24px -12px rgba(15, 23, 42, .12)',
        lift: '0 2px 4px rgba(15, 23, 42, .05), 0 16px 32px -12px rgba(15, 23, 42, .18)',
        glow: '0 0 0 1px rgb(59 130 246 / .15), 0 8px 30px -6px rgb(59 130 246 / .35)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up .45s cubic-bezier(.21,.6,.35,1) both',
        'fade-in': 'fade-in .3s ease both',
      },
    },
  },
  plugins: [],
};
