import {defineConfig} from 'wxt';
import checker from "vite-plugin-checker";

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite: ()=> ({
    plugins: [
      checker({
        typescript: true,
        overlay: false,
      }),
    ],
  }),
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  publicDir: 'src/public',
  alias: {
    '@': './src',
  },
});
