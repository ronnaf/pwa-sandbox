import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  define: {
    global: {},
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      manifest: {
        theme_color: "#ffffff",
        background_color: "#ffffff",
        icons: [
          {
            purpose: "maskable",
            sizes: "512x512",
            src: "icon512_maskable.png",
            type: "image/png",
          },
          {
            purpose: "any",
            sizes: "512x512",
            src: "icon512_rounded.png",
            type: "image/png",
          },
        ],
        orientation: "portrait",
        display: "standalone",
        dir: "left",
        lang: "en-US",
        name: "ro-pwa",
        short_name: "ro-pwa",
        start_url: "/",
      },
    }),
  ],
});
