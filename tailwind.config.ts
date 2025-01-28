import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'tv': { 'max': '1536px' }, // Applies styles below 1536px
        'desktop': { 'max': '1200px' }, // Applies styles below 1200px
        'tablet-lg': { 'max': '1000px' }, // Applies styles below 1000px
        'tablet': { 'max': '860px' }, // Applies styles below 860px
        'mobile': { 'max': '640px' }, // Applies styles below 640px
        'small': { 'max': '480px' }, // Applies styles below 480px
      },
    },
  },
  plugins: [],
} satisfies Config;
