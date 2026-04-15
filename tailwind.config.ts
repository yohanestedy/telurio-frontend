import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff5ed',
          100: '#ffe7d4',
          200: '#ffcaa6',
          300: '#ffab74',
          400: '#ff8a43',
          500: '#ff7420',
          600: '#f35f10',
          700: '#ca470c',
          800: '#a13a12',
          900: '#813214',
        },
        ink: {
          50: '#f7f7f6',
          100: '#efefec',
          200: '#dad9d4',
          300: '#c1bfb6',
          400: '#a7a396',
          500: '#8d8779',
          600: '#746d60',
          700: '#5d574d',
          800: '#4e4941',
          900: '#433f39',
        },
      },
      boxShadow: {
        glass: '0 24px 80px rgba(15, 23, 42, 0.10)',
        soft: '0 10px 35px rgba(15, 23, 42, 0.08)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        shell:
          'radial-gradient(circle at top left, rgba(255,138,67,0.17), transparent 26%), radial-gradient(circle at top right, rgba(255,197,128,0.18), transparent 24%), radial-gradient(circle at bottom left, rgba(255,240,226,0.85), transparent 32%), linear-gradient(180deg, rgba(255,251,247,0.94), rgba(246,241,235,0.98))',
      },
    },
  },
}
