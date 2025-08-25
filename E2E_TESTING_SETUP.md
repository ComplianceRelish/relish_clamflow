# E2E Testing Setup Guide

## Playwright Configuration (Future Implementation)

When you're ready to implement E2E testing, follow these steps:

### 1. Install Playwright
```bash
npm install --save-dev @playwright/test
npx playwright install
```

### 2. Create Playwright Config
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-report/results.json' }],
    process.env.CI ? ['github'] : ['list']
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox', 
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
```

### 3. Add Scripts to package.json
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

### 4. Create E2E Test Directory
```
e2e/
├── auth.spec.ts
├── forms.spec.ts  
├── dashboard.spec.ts
└── global-setup.ts
```

### 5. Example Test
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@clamflow.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard')
})
```

## Current Testing Setup

For now, use Jest for unit and integration testing:
```bash
npm test                    # Run all Jest tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report
```

## Phase 2 Implementation Priority

1. ✅ Complete Phase 1 (Type definitions, middleware, error handling)
2. 🔄 Phase 2: Component implementation and integration
3. 🔄 Phase 3: E2E testing with Playwright (future)
