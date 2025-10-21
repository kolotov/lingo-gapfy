import {defineConfig} from 'wxt';
import checker from "vite-plugin-checker";

// See https://wxt.dev/api/config.html
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
});
