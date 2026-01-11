/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*',
  ],
  safelist: [
    'bg-black',
    'text-white',
    'bg-white',
    'text-black',
    'text-white/60',
    'text-white/70',
    'bg-neutral-950',
    'border-white/10',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
