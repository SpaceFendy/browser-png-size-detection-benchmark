import { defineConfig, UserConfig } from 'vite';

export default defineConfig({
    base: '/browser-png-size-detection-benchmark/',
    server: {
        https: {
            key: process.env['SSL_KEY'],
            cert: process.env['SSL_CERT'],
        },
        port: 3001
    },
} as UserConfig);
