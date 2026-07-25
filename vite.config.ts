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
        // [Local Dev Support] Middleware for /api/auth/profile during `npm run dev` (dev.bat)
        server.middlewares.use('/api/auth/profile', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
          }

          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { accessToken } = JSON.parse(body);
              if (!accessToken) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ success: false, error: 'Access token is required' }));
              }

              // Fetch user profile from Naver server-side (Node.js) to avoid CORS
              const profileResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Accept': 'application/json'
                }
              });

              const data = await profileResponse.json();
              res.setHeader('Content-Type', 'application/json');

              if (!profileResponse.ok || data.resultcode !== '00') {
                res.statusCode = profileResponse.status;
                return res.end(JSON.stringify({
                  success: false,
                  error: data.message || 'Failed to fetch Naver profile'
                }));
              }

              res.end(JSON.stringify({
                success: true,
                profile: data
              }));

            } catch (error: any) {
              console.error('[LOCAL_DEV_PROFILE_ERROR]', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ 
                success: false, 
                error: 'Internal server error while fetching profile',
                message: error.message 
              }));
            }
          });
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
