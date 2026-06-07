import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = "https://cocktail-yzv9.onrender.com";

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
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://www.gstatic.com; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://cocktail-yzv9.onrender.com http: ws:"
    },
    proxy: {
      "/api": apiTarget
    }
  }
});
