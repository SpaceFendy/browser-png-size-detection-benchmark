import { defineConfig, UserConfig } from 'vite';

export default defineConfig({
    base: '/browser-png-size-detection-benchmark/',
    server: {
        https: {
            key: '/home/fendy/.ssl/dev.key',
            cert: '/home/fendy/.ssl/dev.crt',
        },
        port: 3001
    },
} as UserConfig);
