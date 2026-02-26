import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        brand: {
          black: '#0a0a0a',
          white: '#fafafa',
          gray: {
            50: '#f9f9f9',
            100: '#f0f0f0',
            200: '#e0e0e0',
            300: '#c0c0c0',
            400: '#909090',
            500: '#606060',
            600: '#404040',
            700: '#303030',
            800: '#202020',
            900: '#101010',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
