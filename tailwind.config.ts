import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f1faf7',
          100: '#d9f1e8',
          200: '#b5e2d2',
          300: '#86cfb5',
          400: '#54b794',
          500: '#379b79',
          600: '#267c61',
          700: '#1f634f',
          800: '#1c5041',
          900: '#1a4236',
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
          'radial-gradient(circle at top left, rgba(56, 189, 150, 0.16), transparent 28%), radial-gradient(circle at top right, rgba(245, 158, 11, 0.10), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.92), rgba(247,248,246,0.98))',
      },
    },
  },
}
