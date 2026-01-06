/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './*.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      // Custom colors matching existing design
      colors: {
        primary: {
          50: '#e8f1fd',
          100: '#d1e3fb',
          200: '#a3c7f7',
          300: '#75abf3',
          400: '#478fef',
          500: '#1a73e8', // Main primary color
          600: '#155cba',
          700: '#10458b',
          800: '#0a2e5d',
          900: '#05172e',
        },
        secondary: {
          50: '#fef3cd',
          100: '#fde59b',
          200: '#fcd769',
          300: '#fbc937',
          400: '#fabb05',
          500: '#f9a825', // Warning/accent color
          600: '#c78c1e',
          700: '#957016',
          800: '#63540f',
          900: '#313807',
        },
        success: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#28a745', // Available status
          600: '#218838',
          700: '#1a6b2c',
          800: '#134e20',
          900: '#0d3114',
        },
        danger: {
          50: '#fce4e4',
          100: '#f9c9c9',
          200: '#f3a3a3',
          300: '#ed7d7d',
          400: '#e75757',
          500: '#dc3545', // Unavailable status
          600: '#b02a37',
          700: '#841f29',
          800: '#58151b',
          900: '#2c0a0e',
        },
        neutral: {
          50: '#f8f9fa',
          100: '#f5f7f9',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#6c757d',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
        },
      },

      // Custom font family
      fontFamily: {
        sans: ['Roboto', 'system-ui', '-apple-system', 'sans-serif'],
      },

      // Custom spacing for facility cards
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },

      // Custom border radius
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },

      // Custom box shadows
      boxShadow: {
        'card': '0 2px 10px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 20px rgba(0, 0, 0, 0.1)',
        'modal': '0 10px 40px rgba(0, 0, 0, 0.2)',
      },

      // Custom animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },

      // Custom max-width for containers
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },

      // Custom z-index values
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },

  plugins: [
    // Custom plugin for status badges
    function({ addComponents, theme }) {
      addComponents({
        // Status badge base styles
        '.status-badge': {
          display: 'inline-flex',
          alignItems: 'center',
          padding: `${theme('spacing.1')} ${theme('spacing.3')}`,
          fontSize: theme('fontSize.sm'),
          fontWeight: theme('fontWeight.medium'),
          borderRadius: theme('borderRadius.full'),
          whiteSpace: 'nowrap',
        },

        // Available status
        '.status-available': {
          backgroundColor: theme('colors.success.100'),
          color: theme('colors.success.700'),
        },

        // Unavailable status
        '.status-unavailable': {
          backgroundColor: theme('colors.danger.100'),
          color: theme('colors.danger.700'),
        },

        // Waitlist status
        '.status-waitlist': {
          backgroundColor: theme('colors.secondary.100'),
          color: theme('colors.secondary.700'),
        },

        // Contact for availability status
        '.status-call': {
          backgroundColor: theme('colors.primary.100'),
          color: theme('colors.primary.700'),
        },

        // Not updated status
        '.status-not-updated': {
          backgroundColor: theme('colors.neutral.200'),
          color: theme('colors.neutral.600'),
        },

        // Facility card styles
        '.facility-card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.card'),
          padding: theme('spacing.4'),
          transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
          '&:hover': {
            boxShadow: theme('boxShadow.card-hover'),
            transform: 'translateY(-2px)',
          },
        },

        // Action button styles
        '.action-btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme('spacing.2'),
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          fontSize: theme('fontSize.sm'),
          fontWeight: theme('fontWeight.semibold'),
          color: '#ffffff',
          backgroundColor: theme('colors.primary.500'),
          backgroundImage: 'linear-gradient(135deg, #1a73e8, #4285f4)',
          border: 'none',
          borderRadius: theme('borderRadius.lg'),
          boxShadow: '0 2px 8px rgba(26, 115, 232, 0.3)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            backgroundImage: 'linear-gradient(135deg, #1558b6, #3367d6)',
            boxShadow: '0 4px 12px rgba(26, 115, 232, 0.4)',
            transform: 'translateY(-2px)',
            color: '#ffffff',
          },
          '&:focus': {
            outline: '2px solid #1a73e8',
            outlineOffset: '2px',
          },
          '& i': {
            color: '#ffffff',
          },
        },

        // Primary button
        '.btn-primary': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme('spacing.2'),
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          fontSize: theme('fontSize.base'),
          fontWeight: theme('fontWeight.medium'),
          color: theme('colors.white'),
          backgroundColor: theme('colors.primary.500'),
          borderRadius: theme('borderRadius.md'),
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          border: 'none',
          '&:hover': {
            backgroundColor: theme('colors.primary.600'),
          },
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme('colors.primary.200')}`,
          },
          '&:disabled': {
            backgroundColor: theme('colors.neutral.400'),
            cursor: 'not-allowed',
          },
        },

        // Filter group styles
        '.filter-group': {
          marginBottom: theme('spacing.4'),
          '& label': {
            display: 'block',
            marginBottom: theme('spacing.1'),
            fontSize: theme('fontSize.sm'),
            fontWeight: theme('fontWeight.medium'),
            color: theme('colors.neutral.700'),
          },
          '& select': {
            width: '100%',
            padding: `${theme('spacing.2')} ${theme('spacing.3')}`,
            fontSize: theme('fontSize.sm'),
            borderRadius: theme('borderRadius.md'),
            border: `1px solid ${theme('colors.neutral.300')}`,
            backgroundColor: theme('colors.white'),
            transition: 'border-color 0.2s ease-in-out',
            '&:focus': {
              outline: 'none',
              borderColor: theme('colors.primary.500'),
              boxShadow: `0 0 0 3px ${theme('colors.primary.100')}`,
            },
          },
        },
      });
    },
  ],
};
