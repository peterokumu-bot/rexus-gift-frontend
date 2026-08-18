import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Rexus brand — matched to official logo
        // Primary green from logo mark
        jungle: {
          50:  '#f0f7f3',
          100: '#dceee4',
          200: '#b8dcc9',
          300: '#8bc4a8',
          400: '#5aa882',
          500: '#2F6B52', // Main logo green
          600: '#275a45',
          700: '#204a39',
          800: '#1a3b2e',
          900: '#142f25',
          950: '#0c1c16',
        },
        // Accent gold/mustard from logo diamond
        gold: {
          50:  '#fbf8eb',
          100: '#f5efd0',
          200: '#ebdea6',
          300: '#dec874',
          400: '#d1b04a',
          500: '#C4A227', // Main logo gold
          600: '#a88620',
          700: '#8a6c1c',
          800: '#70561c',
          900: '#5c471b',
          950: '#35270c',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;
