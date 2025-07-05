/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3ECF8E", // 슈파베이스 네온 그린
        background: "#0c0c0c", // 다크 배경
        section: "#232425", // 다크그레이 섹션
        card: "#0f0f0f", // 카드 배경
        text: "#ffffff", // 화이트 텍스트
        textSecondary: "#a0a0a0", // 보조 텍스트
        border: "#2a2a2a", // 보더 색상
        success: "#3ECF8E", // 상승 (그린) - 해외 기준
        danger: "#ff4757" // 하락 (레드) - 해외 기준
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      }
    },
  },
  plugins: [],
}

