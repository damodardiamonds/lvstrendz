
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#A0463E",
          50: "#F9EDEC",
          100: "#F2D5D3",
          200: "#E5ABA7",
          300: "#D8817B",
          400: "#CB574F",
          500: "#A0463E",
          600: "#803832",
          700: "#602A25",
          800: "#401C19",
          900: "#200E0C",
        },
        primary: {
          DEFAULT: "#8B5E3C",
          50: "#F8F4F0",
          100: "#F1E8DE",
          200: "#E4D0BC",
          300: "#D1B08F",
          400: "#B98A63",
          500: "#8B5E3C",
          600: "#744B2A",
        },
        gold: "#C8A45D",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-playfair)", "serif"],
      },
      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,.08)",
        hover: "0 10px 30px rgba(0,0,0,.15)",
        navbar: "0 2px 12px rgba(0,0,0,.05)",
      },
      animation: {
        "scroll-left": "scroll-left 30s linear infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
      },
      keyframes: {
        "scroll-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

