import {defineConfig} from 'wxt';
import checker from "vite-plugin-checker";

// See https://wxt.dev/api/config.html
// noinspection JSUnusedGlobalSymbols
export default defineConfig({
  vite: ()=> ({
    css: {
      devSourcemap: true,
      modules: {
        generateScopedName: 'lingo-gapfy__[local]__[hash:base64:5]',
      }
    },
    plugins: [
      checker({
        typescript: true,
        overlay: false,
      }),
    ],
  }),
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  alias: {
    '@': './src',
  },
  manifest: {
    manifest_version: 3,
    name: "Lingo Gapfy",
    action: {
      default_title: "Lingo Gapfy",
    },
  },
});
