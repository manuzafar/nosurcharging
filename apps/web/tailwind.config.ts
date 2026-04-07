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
        // ── Accent system (approval LED green) ──
        accent: {
          DEFAULT: '#1A6B5A',
          light: '#EBF6F3',
          border: '#72C4B0',
          dark: '#0D4A3C',
        },

        // ── Ink scale (ledger text) ──
        ink: {
          DEFAULT: '#1A1409',
          secondary: '#3D3320',
          muted: '#6B5E4A',
          faint: '#9A8C78',
        },

        // ── Paper (receipt cream canvas) ──
        paper: {
          DEFAULT: '#FAF7F2',
          secondary: '#F3EDE4',
          white: '#FFFFFE',
        },

        // ── Borders and dividers ──
        rule: '#DDD5C8',

        // ── P&L semantic pair ──
        positive: {
          DEFAULT: '#166534',
          bg: '#E8F5EB',
        },
        negative: {
          DEFAULT: '#7F1D1D',
          bg: '#FDECEA',
        },

        // ── Chart palette (scheme segment recolour to accent) ──
        chart: {
          interchange: '#E24B4A',
          scheme: '#1A6B5A',
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
        'pulse-accent': 'pulseAccent 1.2s ease-in-out infinite',
        'fade-up': 'fadeUp 0.4s ease forwards',
      },
      keyframes: {
        pulseAccent: {
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
