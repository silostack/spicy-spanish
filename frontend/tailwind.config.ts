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
        'spicy-red': '#FF5C5C',
        'spicy-orange': '#FF9F5C',
        'spicy-light': '#FFF0E8',
        'spicy-dark': '#482C2D'
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
        display: ['var(--font-montserrat)', 'sans-serif']
      }
    },
  },
  plugins: [],
}
export default config