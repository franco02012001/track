/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        /* Dark theme: clean, modern, data-friendly */
        'dark-app-bg': '#0B1220',
        'dark-sidebar-bg': '#0F172A',
        'dark-card-bg': '#121A2F',
        'dark-table-alt': '#0E1627',
        'dark-text-primary': '#F8FAFC',
        'dark-text-secondary': '#CBD5E1',
        'dark-text-muted': '#94A3B8',
        'dark-text-disabled': '#64748B',
        'dark-primary': '#3B82F6',
        'dark-in-progress': '#F59E0B',
        'dark-completed': '#22C55E',
        'dark-error': '#EF4444',
        'dark-info': '#06B6D4',
        'dark-blocked': '#8B5CF6',
        'dark-border': '#1E293B',
        'dark-hover': '#1F2A44',
        'dark-active-row': '#1E40AF33',
        'dark-chart-blue': '#60A5FA',
        'dark-chart-teal': '#2DD4BF',
        'dark-chart-purple': '#A78BFA',
        'dark-chart-orange': '#FB923C',
        'dark-chart-red': '#F87171',
      },
      backgroundImage: {
        'dark-gradient': 'linear-gradient(to right, #3B82F6, #8B5CF6)',
      },
    },
  },
  plugins: [],
}
