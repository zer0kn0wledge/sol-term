import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: 'var(--bg)',
          surface: 'var(--surface)',
          border: 'var(--border)',
          text: 'var(--text)',
          'text-dim': 'var(--text-dim)',
          accent: 'var(--accent)',
          green: 'var(--green)',
          red: 'var(--red)',
          yellow: 'var(--yellow)',
          blue: 'var(--blue)',
          purple: 'var(--purple)',
        },
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['var(--font-sans)', 'sans-serif'],
        code: ['var(--font-code)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
