// tailwind.config.ts
import type { Config } from "tailwindcss"; // Tailwind 設定型別

const config: Config = { // 建立 config
  content: [ // 掃描範圍
    "./src/app/**/*.{ts,tsx}", // App Router
    "./src/components/**/*.{ts,tsx}", // 元件
    "./src/lib/**/*.{ts,tsx}", // lib（如果你在 lib 寫 jsx 的話）
  ], // content 結束
  theme: { // 主題設定
    extend: {}, // 目前不擴充（顏色由 CSS variables 控制）
  }, // theme 結束
  plugins: [], // 暫不使用 plugins
}; // config 結束

export default config; // Tailwind config 允許 default export（工具設定檔不在你的「避免 default export」限制範圍內）