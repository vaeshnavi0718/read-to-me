import { defineConfig, type Connect, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { handleFetch } from './server/fetchArticle'

// Serves /api/fetch?url=... from the same dev server, so links can be read
// without the browser running into cross-origin restrictions.
function articleApi(): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url?.startsWith('/api/fetch')) return next()
    void handleFetch(req, res)
  }
  return {
    name: 'article-api',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  }
}

export default defineConfig({
  plugins: [react(), articleApi()],
  server: { port: 5173 },
})
