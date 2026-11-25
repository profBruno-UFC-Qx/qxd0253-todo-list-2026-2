import { defineConfig } from "vite";

// Sem esta configuração o `vite build` só gera o index.html.
// Cada página HTML do site precisa ser listada como ponto de entrada.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        login: "login.html",
      },
    },
  },
});
