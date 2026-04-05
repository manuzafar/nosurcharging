import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'Courier New', 'monospace'],
      },
      colors: {
        amber: {
          50: '#FAEEDA',
          200: '#EF9F27',
          400: '#BA7517',
          800: '#633806',
        },
        chart: {
          interchange: '#E24B4A',
          scheme: '#BA7517',
          margin: '#888780',
          surcharge: '#3B6D11',
        },
      },
      fontSize: {
        'financial-hero': ['44px', { lineHeight: '1', letterSpacing: '-1px', fontWeight: '500' }],
        'financial-standard': ['22px', { lineHeight: '1.2', fontWeight: '500' }],
        'financial-small': ['14px', { lineHeight: '1.4', fontWeight: '400' }],
        'display': ['32px', { lineHeight: '1.22', fontWeight: '500' }],
        'heading-lg': ['24px', { lineHeight: '1.28', fontWeight: '500' }],
        'heading-md': ['20px', { lineHeight: '1.3', fontWeight: '500' }],
        'heading-sm': ['18px', { lineHeight: '1.35', fontWeight: '500' }],
        'body-lg': ['15px', { lineHeight: '1.65' }],
        'body': ['14px', { lineHeight: '1.65' }],
        'body-sm': ['13px', { lineHeight: '1.6' }],
        'caption': ['12px', { lineHeight: '1.5' }],
        'label': ['11px', { lineHeight: '1.4', letterSpacing: '2px', fontWeight: '500' }],
        'micro': ['10px', { lineHeight: '1.4', letterSpacing: '1px', fontWeight: '500' }],
      },
      borderRadius: {
        pill: '20px',
      },
      maxWidth: {
        assessment: '520px',
        results: '600px',
        content: '480px',
      },
      animation: {
        'pulse-amber': 'pulseAmber 1.2s ease-in-out infinite',
        'fade-up': 'fadeUp 0.4s ease forwards',
      },
      keyframes: {
        pulseAmber: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.6)', opacity: '0.4' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
