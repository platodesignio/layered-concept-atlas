import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        layer: {
          0: { DEFAULT: "#7c3aed", light: "#ede9fe", dark: "#4c1d95" }, // L0 紫
          1: { DEFAULT: "#0891b2", light: "#cffafe", dark: "#164e63" }, // L1 シアン
          2: { DEFAULT: "#d97706", light: "#fef3c7", dark: "#78350f" }, // L2 琥珀
          3: { DEFAULT: "#059669", light: "#d1fae5", dark: "#064e3b" }, // L3 エメラルド
          4: { DEFAULT: "#ea580c", light: "#ffedd5", dark: "#7c2d12" }, // L4 オレンジ
          5: { DEFAULT: "#2563eb", light: "#dbeafe", dark: "#1e3a8a" }, // L5 ブルー
        },
      },
      fontFamily: {
        sans: [
          "Noto Sans JP",
          "Hiragino Kaku Gothic ProN",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
