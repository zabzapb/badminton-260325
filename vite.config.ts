import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'local-api-auth-profile-dev',
      configureServer(server) {
        // [Local Dev Support] Middleware for /api/auth/naver-profile during `npm run dev`
        server.middlewares.use('/api/auth/naver-profile', async (req, res) => {
          try {
            const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
            let token = urlObj.searchParams.get('token');

            if (!token && req.method === 'POST') {
              let body = '';
              await new Promise<void>((resolve) => {
                req.on('data', chunk => { body += chunk.toString(); });
                req.on('end', () => resolve());
              });
              if (body) {
                try {
                  const parsed = JSON.parse(body);
                  token = parsed.token || parsed.accessToken;
                } catch (e) {}
              }
            }

            if (!token) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              return res.end(JSON.stringify({ success: false, error: 'Missing access token parameter' }));
            }

            // Fetch user profile from Naver server-side (Node.js) to avoid CORS
            const profileResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });

            const data = await profileResponse.json();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');

            if (!profileResponse.ok) {
              res.statusCode = profileResponse.status;
              return res.end(JSON.stringify({
                success: false,
                error: `Naver API returned ${profileResponse.status}`,
                data
              }));
            }

            res.statusCode = 200;
            res.end(JSON.stringify(data));

          } catch (error: any) {
            console.error('[LOCAL_DEV_PROFILE_ERROR]', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ 
              success: false, 
              error: error.message || 'Internal dev proxy error'
            }));
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage'],
        },
      },
    },
  },
})
