/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
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

        border: "#E5E7EB",

        background: "#FAFAFA",

        text: {
          DEFAULT: "#1F2937",
          light: "#6B7280",
        },
      },

      fontFamily: {
        heading: ["var(--font-heading)"],
        body: ["var(--font-inter)"],
      },

      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,.08)",
        hover: "0 10px 30px rgba(0,0,0,.15)",
        navbar: "0 2px 12px rgba(0,0,0,.05)",
      },
    },
  },

  plugins: [],
};