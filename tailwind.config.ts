import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./emails/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: "#E8147F",
          yellow: "#F5C418",
          dark: "#0A0A0A",
          cream: "#FAF7F0",
        },
      },
      fontFamily: {
        sans: ["var(--font-exo2)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
