/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: { extend: { colors: {
    background: 'rgb(var(--color-background-rgb) / <alpha-value>)',
    foreground: 'rgb(var(--color-foreground-rgb) / <alpha-value>)',
    muted: { DEFAULT: 'rgb(var(--color-muted-rgb) / <alpha-value>)', foreground: 'rgb(var(--color-muted-foreground-rgb) / <alpha-value>)' },
    card: { DEFAULT: 'rgb(var(--color-card-rgb) / <alpha-value>)', foreground: 'rgb(var(--color-card-foreground-rgb) / <alpha-value>)' },
    border: 'rgb(var(--color-border-rgb) / <alpha-value>)', ring: 'rgb(var(--color-ring-rgb) / <alpha-value>)',
    chart: {
      1: 'rgb(var(--color-chart-1-rgb) / <alpha-value>)', 2: 'rgb(var(--color-chart-2-rgb) / <alpha-value>)',
      3: 'rgb(var(--color-chart-3-rgb) / <alpha-value>)', 4: 'rgb(var(--color-chart-4-rgb) / <alpha-value>)',
      5: 'rgb(var(--color-chart-5-rgb) / <alpha-value>)',
    },
  } } },
  plugins: [],
};
