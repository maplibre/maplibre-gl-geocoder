import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        name: 'integration',
        environment: 'node',
        include: [
            'test/integration/**/*.test.ts',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['json', 'html'],
            all: true,
            include: ['src'],
            reportsDirectory: './coverage/vitest/integration',
        },
    },
});
