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
          // #FF6B35 pedido para la pantalla del cliente. El resto del sitio
          // (landing, admin) ya usaba un naranja muy cercano, asi que queda
          // consistente en toda la marca.
          400: '#ff9166',
          500: '#FF6B35',
          600: '#e8551f',
        },
        cream: '#faf7f2',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
