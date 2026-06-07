import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "local-browser-noise-guard",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url?.startsWith("/.well-known/appspecific/")) {
            response.statusCode = 204;
            response.end();
            return;
          }

          next();
        });
      }
    }
  ],
  server: {
    headers: {
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://www.gstatic.com; img-src 'self' data:; font-src 'self' data:; connect-src 'self' http: ws:"
    },
    proxy: {
      "/api": "http://127.0.0.1:4174"
    }
  }
});
