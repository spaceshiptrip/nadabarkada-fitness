/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(210 20% 98%)',
        foreground: 'hsl(222 47% 11%)',
        card: 'hsl(0 0% 100%)',
        'card-foreground': 'hsl(222 47% 11%)',
        border: 'hsl(214 32% 91%)',
        primary: 'hsl(221 83% 53%)',
        'primary-foreground': 'hsl(0 0% 100%)',
        muted: 'hsl(210 40% 96%)',
        'muted-foreground': 'hsl(215 16% 47%)',
        accent: 'hsl(142 71% 45%)',
        'accent-foreground': 'hsl(0 0% 100%)',
      },
      borderRadius: {
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 12px 30px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
