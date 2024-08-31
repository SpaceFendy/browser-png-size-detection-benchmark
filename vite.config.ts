import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        https: {
            key: '/home/fendy/.ssl/dev.key',
            cert: '/home/fendy/.ssl/dev.crt',
        },
        port: 3001
    },
});
