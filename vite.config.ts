import { defineConfig } from 'vite';

// If building for GitHub Pages under repo 'quantumar', assets must be served
// from '/quantumar/'. Use env var GITHUB_PAGES=1 to toggle that base.
const base = process.env.GITHUB_PAGES ? '/quantumar/' : '/';

export default defineConfig({
  base,
  server: {
    host: true,
    https: false
  }
});
