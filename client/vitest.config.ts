import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        browser: {
            provider: 'playwright', // or 'webdriverio'
            enabled: true,
            headless: true,
            // at least one instance is required
            instances: [
                { browser: 'chromium' },
            ],
        },
        coverage: {
            include: ["src"]
        },
    }
})