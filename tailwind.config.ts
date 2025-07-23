import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfeff', // light cyan tint
          100: '#cffafe',
          500: '#06b6d4', // cyan primary
          600: '#0891b2',
          700: '#0e7490',
        },
        secondary: {
          50: '#eef2ff', // indigo tint
          100: '#e0e7ff',
          500: '#6366f1', // indigo primary
          600: '#4f46e5',
          700: '#4338ca',
        },
        surface: {
          800: '#1e293b', // dark surface for cards/backgrounds
          900: '#0f172a',
        }
      },
    },
  },
  plugins: [],
}
export default config 