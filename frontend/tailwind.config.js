/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Misma paleta que la landing (verde oscuro + acento naranja),
        // para que la marca Comandy se sienta consistente en todo el sitio.
        brand: {
          50: '#eef7f3',
          100: '#d7ebe2',
          400: '#1f6f57',
          500: '#16473a',
          600: '#0f2d24',
          900: '#0a1f19',
        },
        accent: {
          400: '#ff9466',
          500: '#ff7a45',
          600: '#ff5e22',
        },
        cream: '#faf7f2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
