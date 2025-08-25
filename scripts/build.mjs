import * as esbuild from 'esbuild';
import { rimraf } from 'rimraf';
import stylePlugin from 'esbuild-style-plugin';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

// Load environment variables from a .env file into process.env
import 'dotenv/config';

const args = process.argv.slice(2);
const isProd = args[0] === '--production';

await rimraf('dist');

/**
 * @type {esbuild.BuildOptions}
 */
const esbuildOpts = {
  color: true,
  entryPoints: ['src/main.tsx', 'index.html'],
  outdir: 'dist',
  entryNames: '[name]',
  write: true,
  bundle: true,
  format: 'iife',
  sourcemap: isProd ? false : 'linked',
  minify: isProd,
  treeShaking: true,
  jsx: 'automatic',
  loader: {
    '.html': 'copy',
    '.png': 'file',
    '.svg': 'file',
    '.jpeg': 'file',
    '.jpg': 'file',
  },
  alias: {
    '@': './src',
  },
  plugins: [
    stylePlugin({
      postcss: {
        plugins: [tailwindcss, autoprefixer],
      },
    }),
  ],
  // Injects environment variables into the client-side code at build time.
  // This replaces `process.env.VARIABLE_NAME` with the actual string value.
  define: {
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
  },
};

if (isProd) {
  await esbuild.build(esbuildOpts);
} else {
  const ctx = await esbuild.context(esbuildOpts);
  await ctx.watch();
  const { hosts, port } = await ctx.serve();
  console.log(`Running on:`);
  hosts.forEach((host) => {
    console.log(`http://${host}:${port}`);
  });
}
