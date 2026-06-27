import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Serve api_response.json on /api/leaderboard for local dev
    {
      name: 'local-api',
      configureServer(server) {
        server.middlewares.use('/api/leaderboard', (_req, res) => {
          const filePath = path.resolve(__dirname, 'api_response.json');
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'application/json');
            res.end(fs.readFileSync(filePath, 'utf8'));
          } else {
            res.statusCode = 404;
            res.end('{}');
          }
        });
      },
    },
  ],
})
