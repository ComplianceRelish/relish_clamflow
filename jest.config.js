// Jest configuration for ClamFlow Frontend
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test environment setup
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module path mapping (matching tsconfig.json paths)
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '^@utils/(.*)$': '<rootDir>/src/lib/utils',
  },

  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.{js,jsx,ts,tsx}',
  ],

  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
  ],

  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Mock static assets
  moduleNameMapping: {
    ...customJestConfig.moduleNameMapping,
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/__mocks__/fileMock.js',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/node_modules/**',
    '!src/types/**',
  ],

  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Multiple projects for different test types
  projects: [
    // Unit tests
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.unit.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/*.unit.(test|spec).{js,jsx,ts,tsx}',
      ],
      testEnvironment: 'jsdom',
    },
    // Component tests
    {
      displayName: 'ui',
      testMatch: [
        '<rootDir>/src/components/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/src/components/**/*.(test|spec).{js,jsx,ts,tsx}',
      ],
      testEnvironment: 'jsdom',
    },
    // Integration tests
    {
      displayName: 'integration',
      testMatch: [
        '<rootDir>/tests/integration/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/*.integration.(test|spec).{js,jsx,ts,tsx}',
      ],
      testEnvironment: 'jsdom',
    },
    // API tests
    {
      displayName: 'api',
      testMatch: [
        '<rootDir>/src/pages/api/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/src/pages/api/**/*.(test|spec).{js,jsx,ts,tsx}',
      ],
      testEnvironment: 'node',
    },
  ],

  // Global test timeout
  testTimeout: 10000,

  // Verbose output in CI
  verbose: process.env.CI === 'true',

  // Additional Jest options
  bail: process.env.CI === 'true' ? 1 : 0,
  cache: true,
  watchman: true,
  
  // Custom global variables for tests
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
}

// Create and export the Jest config
module.exports = createJestConfig(customJestConfig)
