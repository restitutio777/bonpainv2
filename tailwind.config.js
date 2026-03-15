/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['DM Sans', '-apple-system', 'sans-serif'],
      },
      colors: {
        cream: {
          DEFAULT: '#FAF6F1',
          dark: '#F0E9DF',
        },
        warm: {
          50: '#FDF8F3',
          100: '#F5EDE3',
          200: '#E8D9C8',
          300: '#D4BFA5',
          400: '#BFA07E',
          500: '#A67C52',
          600: '#8B6340',
          700: '#6E4D32',
          800: '#4A3321',
          900: '#2D1F14',
        },
        accent: {
          DEFAULT: '#C4854C',
          light: '#D4A373',
          dark: '#8B5E34',
        },
      },
      spacing: {
        18: '72px',
      },
      borderRadius: {
        'xl2': '20px',
        'xl3': '32px',
      },
      boxShadow: {
        sm2: '0 1px 3px rgba(45, 31, 20, 0.06)',
        md2: '0 4px 16px rgba(45, 31, 20, 0.08)',
        lg2: '0 8px 32px rgba(45, 31, 20, 0.1)',
        xl2: '0 16px 48px rgba(45, 31, 20, 0.12)',
      },
      animation: {
        'float-wheat': 'floatWheat 4s ease-in-out infinite',
        'grain': 'grain 8s steps(10) infinite',
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in': 'fadeIn 1s ease forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-down': 'slideDown 0.5s ease',
        'scroll-line': 'floatWheat 2s ease-in-out infinite',
      },
      keyframes: {
        floatWheat: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(2deg)' },
        },
        grain: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-5%, -10%)' },
          '30%': { transform: 'translate(3%, -15%)' },
          '50%': { transform: 'translate(-10%, 5%)' },
          '70%': { transform: 'translate(8%, -5%)' },
          '90%': { transform: 'translate(-3%, 10%)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
