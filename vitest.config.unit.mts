import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        name: 'unit',
        environment: 'jsdom',
        include: [
            'test/unit/*.test.ts'
        ],
        clearMocks: true,
        coverage: {
            provider: 'v8',
            reporter: ['json', 'html'],
            all: true,
            include: ['lib'],
            reportsDirectory: './coverage/vitest/unit',
        },
    },
});
