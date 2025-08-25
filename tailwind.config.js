/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Relish Brand Colors
        relish: {
          // Purple family (primary brand color)
          50: '#FAF5FF',
          100: '#F3E8FF', 
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#8B5CF6', // Main purple
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        ocean: {
          // Seafoam green family (secondary)
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981', // Main seafoam
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        sunset: {
          // Orange family (accent)
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316', // Main orange
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        cream: {
          // Warm neutral backgrounds
          50: '#FEFEFE',
          100: '#FDFCFC',
          200: '#F9F7F4',
          300: '#F5F5DC', // Main cream
          400: '#F0EDD1',
          500: '#E8E2B8',
          600: '#D4C89A',
          700: '#B8A876',
          800: '#9A8B5C',
          900: '#7A6F47',
        }
      },
      backgroundImage: {
        'gradient-relish': 'linear-gradient(135deg, #8B5CF6 0%, #10B981 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
        'gradient-cream': 'linear-gradient(135deg, #F5F5DC 0%, #F0EDD1 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
