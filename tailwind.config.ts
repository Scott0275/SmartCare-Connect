import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        primary: '#10B981', // Teal-500
        secondary: '#6B7280', // Gray-500
        accent: '#F97316', // Orange-500
        success: '#10B981', // Green-500
        danger: '#EF4444', // Red-500
        warning: '#F59E0B', // Amber-500
      },
    },
  },
  plugins: [],
};

export default config;
