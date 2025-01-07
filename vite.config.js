import { defineConfig } from "vite";
import { resolve } from "path";
import { copyFileSync } from "fs";
import AdmZip from "adm-zip";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        content: resolve(__dirname, "js/content.js"),
        background: resolve(__dirname, "js/background.js"),
        popup: resolve(__dirname, "js/popup.js"),
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
    outDir: "dist",
    sourcemap: true,
    minify: "esbuild",
  },
  plugins: [
    {
      name: "zip-extension",
      // This hook runs after the entire build is finished
      closeBundle() {
        // 1) Copy config.json if needed:
        copyFileSync(resolve(__dirname, "config.json"), resolve(__dirname, "dist/config.json"));

        // 2) Create the zip
        const zip = new AdmZip();
        // Include dist/ at root inside the zip
        zip.addLocalFolder(resolve(__dirname, "dist"), "dist");
        // Add icons folder
        zip.addLocalFolder(resolve(__dirname, "icons"), "icons");
        // Add html folder
        zip.addLocalFolder(resolve(__dirname, "html"), "html");
        // Add manifest.json at root
        zip.addLocalFile(resolve(__dirname, "manifest.json"));

        // 3) Write zip
        zip.writeZip(resolve(__dirname, "youtube-auto-liker.zip"));
        console.log("Extension zipped as youtube-auto-liker.zip!");
      },
    },
  ],
});
