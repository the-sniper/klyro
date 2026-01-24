/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Map your existing CSS variables here if needed for utility usage
        // e.g., 'primary': 'var(--accent-primary)',
      },
    },
  },
  plugins: [],
};
