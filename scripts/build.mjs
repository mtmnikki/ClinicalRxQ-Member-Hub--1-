import * as esbuild from 'esbuild'
import { rimraf } from 'rimraf'
import stylePlugin from 'esbuild-style-plugin'
import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'
import path from 'node:path'

// Load .env into process.env for dev/build
import 'dotenv/config'

const args = process.argv.slice(2)
const isProd = args.includes('--production')

await rimraf('dist')

/** @type {esbuild.BuildOptions} */
const esbuildOpts = {
  entryPoints: ['src/main.tsx'],
  outdir: 'dist',
  bundle: true,
  splitting: true,
  sourcemap: !isProd,
  minify: isProd,
  target: ['es2019', 'chrome100', 'edge100', 'firefox100', 'safari15'],
  format: 'esm',
  jsx: 'automatic',
  metafile: true,
  logLevel: 'info',
  loader: {
    '.png': 'file',
    '.jpg': 'file',
    '.svg': 'file',
    '.woff': 'file',
    '.woff2': 'file',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || ''),
  },
  plugins: [
    stylePlugin({
      // This picks up your Tailwind in src/shadcn.css
      postcss: {
        plugins: [tailwindcss, autoprefixer],
      },
    }),
  ],
  // Simple alias: @/* -> src/*
  alias: { '@': path.resolve(process.cwd(), 'src') },
  // Keep index.html simple; we’ll serve dist/
}

// Build or dev-serve
if (isProd) {
  await esbuild.build(esbuildOpts)
  process.exit(0)
}

const ctx = await esbuild.context(esbuildOpts)
await ctx.watch()
const { port, host } = await ctx.serve({
  servedir: 'dist',
})
console.log(`Dev server: http://${host || 'localhost'}:${port}`)
