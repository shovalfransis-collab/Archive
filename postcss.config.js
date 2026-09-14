// Tailwind CSS v4 plugs into the build as a single PostCSS plugin — no
// separate tailwind.config.js or autoprefixer needed, it handles both
// itself.
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
