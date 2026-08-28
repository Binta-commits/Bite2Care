import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-teal": {
          900: "#0F3331",
          800: "#164A47",
          700: "#1C615D",
        },
        "brand-gold": {
          500: "#EBA014",
          600: "#C7850F",
        },
      },
    },
  },
  plugins: [],
};

export default config;
