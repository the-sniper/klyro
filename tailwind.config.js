/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Design system colors mapped from CSS variables
        primary: "var(--accent-primary)",
        secondary: "var(--accent-secondary)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        border: {
          DEFAULT: "var(--border-color)",
          hover: "var(--border-hover)",
        },
        glass: {
          bg: "var(--glass-bg)",
          border: "var(--glass-border)",
          highlight: "var(--glass-highlight)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        lg: "var(--shadow-lg)",
        glow: "var(--accent-glow)",
      },
      backgroundImage: {
        "accent-gradient": "var(--accent-gradient)",
      },
    },
  },
  plugins: [],
};
